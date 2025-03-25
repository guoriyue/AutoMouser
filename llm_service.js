const MODEL_CONFIGS = {
    'gpt4': {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }),
        prepareBody: (messages) => ({
            model: 'gpt-4-turbo',
            messages: messages,
            temperature: 0.7,
            max_tokens: 4000
        }),
        parseResponse: (data) => data.choices[0]?.message?.content || '',
    },
    'gpt3.5': {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }),
        prepareBody: (messages) => ({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            max_tokens: 4000
        }),
        parseResponse: (data) => data.choices[0]?.message?.content || '',
    },
    'deepseek': {
        endpoint: 'https://api.deepseek.com/chat/completions',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }),
        prepareBody: (messages) => ({
            model: 'deepseek-chat',
            messages: messages,
            stream: false,
        }),
        parseResponse: (data) => data.choices[0]?.message?.content || '',
    }
};


export async function generateWithLLM(messages, llmConfig, jsonStr, popupId, errorHTML) {
    const modelName = llmConfig.active_model;
    const apiKey = llmConfig.models[modelName]?.api_key;
    const modelConfig = MODEL_CONFIGS[modelName];

    if (!modelConfig) {
        console.error(`Unsupported model: ${modelName}`);
        showErrorPopup(popupId, errorHTML);
        throw new Error(`Unsupported model: ${modelName}`);
    }
    if (!apiKey) {
        console.error(`API key for model ${modelName} is missing.`);
        showErrorPopup(popupId, errorHTML);
        throw new Error(`API key for model ${modelName} is missing.`);
    }

    // Log the request details for debugging (without exposing the full API key)
    console.log(`Making request to: ${modelConfig.endpoint}`);
    console.log(`Model: ${modelName}`);
    console.log(`API Key format: ${apiKey.substring(0, 8)}...`);
    
    // Check if messages is properly formatted
    if (!Array.isArray(messages)) {
        console.error('Messages is not an array:', typeof messages);
        showErrorPopup(popupId, errorHTML);
        throw new Error('Messages must be an array');
    }

    console.log('Messages structure:', messages.map(m => ({role: m.role, contentLength: m.content?.length || 0})));
    
    try {
        // Prepare the request body with updated model names for OpenAI API
        const requestBody = {
            ...modelConfig.prepareBody(messages),
            // OpenAI may have changed their model naming convention
            model: modelName === 'gpt4' ? 'gpt-4-turbo' : modelConfig.prepareBody(messages).model
        };
        
        console.log('Request body structure:', JSON.stringify(requestBody, (key, value) => {
            // Don't log the full content to avoid console clutter
            if (key === 'content' && typeof value === 'string' && value.length > 100) {
                return value.substring(0, 100) + '...';
            }
            return value;
        }, 2));
        
        // Make the API request
        const response = await fetch(modelConfig.endpoint, {
            method: 'POST',
            headers: modelConfig.headers(apiKey),
            body: JSON.stringify(requestBody),
        });

        // Log response info
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            // Get the error details from the response
            let errorDetails = '';
            try {
                const errorJson = await response.json();
                errorDetails = JSON.stringify(errorJson);
                console.error('API Error details:', errorJson);
            } catch (e) {
                errorDetails = await response.text();
                console.error('API Error text:', errorDetails);
            }
            
            console.error(`HTTP error! Status: ${response.status}. Details: ${errorDetails}`);
            showErrorPopup(popupId, errorHTML);
            
            // Create data URL from JSON string
            const jsonDataUrl = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(jsonStr)));
            
            chrome.downloads.download({
                url: jsonDataUrl,
                filename: 'tracking_log.json',
                saveAs: true
            });
            
            throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorDetails}`);
        }

        const data = await response.json();
        let pythonCode = modelConfig.parseResponse(data);

        // Extract code between ```python and ``` markers if present
        const codeMatch = pythonCode.match(/```python\n([\s\S]*?)```/);
        if (codeMatch) {
            pythonCode = codeMatch[1];
        }

        return pythonCode;
    } catch (error) {
        console.error('Error generating code:', error);
        showErrorPopup(popupId, errorHTML);
        throw error;
    }
}

// Helper function to show error popup by updating tab instead of window
function showErrorPopup(windowId, errorHTML) {
    chrome.tabs.query({ windowId: windowId }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {
                url: 'data:text/html;charset=utf-8,' + encodeURIComponent(errorHTML)
            });
        } else {
            console.error('No tabs found in the specified window');
            // Fallback: close the window if we can't update its tab
            chrome.windows.remove(windowId).catch(err => {
                console.error('Error closing error window:', err);
            });
        }
    });
}

// Export the functions that need to be accessible from background.js
export function init() {
    console.log('LLM service initialized');
    // Your initialization code
}

// Export other functions
export function processQuery(text) {
    // Your function code
}