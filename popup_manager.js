import { generateWithLLM } from './llm_service.js';
import * as prompt from './prompt.js';

export function generateCodeWithPopup(jsonBlob, requestBody, xpathMap, LLM_CONFIG) {
    const popupHTML = `
        <html>
        <head>
            <title>Code Generation</title>
            <meta charset="utf-8">
            <style>
                body {
                    width: 300px;
                    padding: 30px;
                    text-align: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: #f8f9fa;
                    margin: 0;
                    color: #2c3e50;
                }
                .container {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h2 {
                    margin: 0 0 15px 0;
                    font-size: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid #e9ecef;
                    border-top: 3px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                p {
                    margin: 15px 0 0 0;
                    color: #6c757d;
                    font-size: 14px;
                    line-height: 1.5;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2><div class="spinner"></div>Generating Code</h2>
                <p>Please wait while LLM processes your actions...</p>
            </div>
        </body>
        </html>
    `;

    const errorHTML = `
        <html>
        <head>
            <title>Error</title>
            <meta charset="utf-8">
            <style>
                body {
                    width: 300px;
                    padding: 30px;
                    text-align: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: #f8f9fa;
                    margin: 0;
                    color: #2c3e50;
                }
                .container {
                    background: #fff5f5;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h2 {
                    margin: 0 0 15px 0;
                    color: #dc3545;
                    font-size: 20px;
                }
                p {
                    margin: 15px 0 0 0;
                    color: #6c757d;
                    font-size: 14px;
                    line-height: 1.5;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>❌ Error</h2>
                <p>Failed to generate code.<br>Check console for details.</p>
            </div>
        </body>
        </html>
    `;

    chrome.windows.create({
        url: 'data:text/html;charset=utf-8,' + encodeURIComponent(popupHTML),
        type: 'popup',
        width: 360,
        height: 240
    }, async (popupWindow) => {
        const popupId = popupWindow.id;

        // Properly read the blob as text
        const jsonStr = await blobToString(jsonBlob);

        // Create properly formatted messages for the API
        const promptContent = prompt.SELENIUM_PROMPT + JSON.stringify(JSON.parse(jsonStr), null, 2);
        
        const messages = [
            { 
                role: "system", 
                content: "You are a helpful assistant that generates Selenium code based on browser actions."
            },
            { 
                role: "user", 
                content: promptContent
            }
        ];

        generateWithLLM(messages, LLM_CONFIG, jsonStr, popupId, errorHTML)
            .then(pythonCode => {
                Object.entries(xpathMap).forEach(([placeholder, xpath]) => {
                    pythonCode = pythonCode.replace(new RegExp(placeholder, 'g'), xpath);
                });

                // Create data URLs for downloads
                const jsonDataUrl = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(jsonStr)));
                const pythonDataUrl = 'data:application/x-python;base64,' + btoa(unescape(encodeURIComponent(pythonCode)));
                
                chrome.downloads.download({
                    url: jsonDataUrl,
                    filename: 'tracking_log.json',
                    saveAs: true
                });

                chrome.downloads.download({
                    url: pythonDataUrl,
                    filename: 'selenium_test.py',
                    saveAs: true
                });
            })
            .finally(() => {
                setTimeout(() => {
                    chrome.windows.remove(popupId);
                }, 2000);
            });
    });
}

// Helper to convert a Blob to a string
async function blobToString(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(blob);
    });
}
