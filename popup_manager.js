import { generateWithLLM } from './llm_service.js';

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
    }, (popupWindow) => {
        const popupId = popupWindow.id;

        generateWithLLM(requestBody.messages, LLM_CONFIG, jsonBlob, popupId, errorHTML)
            .then(pythonCode => {
                Object.entries(xpathMap).forEach(([placeholder, xpath]) => {
                    pythonCode = pythonCode.replace(new RegExp(placeholder, 'g'), xpath);
                });

                const blob = new Blob([pythonCode], { 
                    type: 'application/x-python'
                });
                
                chrome.downloads.download({
                    url: URL.createObjectURL(jsonBlob),
                    filename: 'tracking_log.json',
                    saveAs: true,
                    headers: [{
                        name: 'Content-Type',
                        value: 'application/json'
                    }]
                });

                chrome.downloads.download({
                    url: URL.createObjectURL(blob),
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