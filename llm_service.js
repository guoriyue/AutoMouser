const MODEL_CONFIGS = {
    'gpt4': {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }),
        prepareBody: (messages) => ({
            model: 'gpt-4',
            messages: messages
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
            messages,
        }),
        parseResponse: (data) => data.choices[0]?.message?.content || '', // Add this line
    },
    'deepseek': {
        endpoint: 'https://api.deepseek.com/chat/completions',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }),
        prepareBody: (messages) => ({
            model: 'deepseek-chat',
            messages,
            stream: false,
        }),
        parseResponse: (data) => data.choices[0]?.message?.content || '',
    }
};


export async function generateWithLLM(messages, llmConfig, jsonBlob, popupId, errorHTML) {
    const modelName = llmConfig.active_model;
    const apiKey = llmConfig.models[modelName]?.api_key;
    const modelConfig = MODEL_CONFIGS[modelName];

    if (!modelConfig) {
        throw new Error(`Unsupported model: ${modelName}`);
    }
    if (!apiKey) {
        throw new Error(`API key for model ${modelName} is missing.`);
    }

    try {
        const response = await fetch(modelConfig.endpoint, {
            method: 'POST',
            headers: modelConfig.headers(apiKey),
            body: JSON.stringify(modelConfig.prepareBody(messages)),
        });

        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            chrome.windows.update(popupId, {
                url: 'data:text/html;charset=utf-8,' + encodeURIComponent(errorHTML),
            });
            chrome.downloads.download({
                url: URL.createObjectURL(jsonBlob),
                filename: 'tracking_log.json',
                saveAs: true,
            });
            throw new Error(`HTTP error! Status: ${response.status}`);
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
        chrome.windows.update(popupId, {
            url: 'data:text/html;charset=utf-8,' + encodeURIComponent(errorHTML),
        });
        chrome.downloads.download({
            url: URL.createObjectURL(jsonBlob),
            filename: 'tracking_log.json',
            saveAs: true,
        });
        throw error;
    }
}