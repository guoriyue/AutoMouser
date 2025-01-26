# AutoMouser

<p align="center">
  <img src="icon.png" alt="Icon" width="256">
</p>

AutoMouser is a Chrome extension that turns your browser actions into reusable Selenium test scripts with just one AI call. Unlike typical web automation tools that rely on constant AI interaction, AutoMouser generates a complete, standalone Python script that you can run anytime, anywhere - no further AI calls needed.

## What Makes Us Different?

Most web automation tools using AI require constant communication with large language models - every time you run a test, you're making API calls. AutoMouser is different:
- **One Call**: Generate your test script once and run it unlimited times
- **Precise Replay**: Every click, input, and scroll is captured exactly as performed

## Installation

1. Clone this repository or download the source code
2. Copy `.env.example` to `.env` and add your API keys:
   ```json
   {
       "active_model": "gpt4",  // Choose which model to use
       "models": {
           "gpt4": {
               "api_key": "your-openai-api-key-here"
           },
           "deepseek": {
               "api_key": "your-deepseek-api-key-here"
           }
           // Add other model keys as needed
       }
   }
   ```
   Note: The actual `.env` file is gitignored to protect your API keys. Never commit it to version control.
3. Replace or edit `SELENIUM_PROMPT` with your desired prompt template in `prompt.js` if needed
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right
6. Click "Load unpacked" and select the extension directory

## Usage

1. Click the AutoMouser icon to start recording
2. Perform the actions you want to automate
3. Click the icon again to generate your script
4. Get two files:
   - `selenium_test.py`: Your reusable test script
   - `tracking_log.json`: Raw interaction data (for debugging)
5. Run your script anytime without needing AI!

The key difference: Once generated, your test script is completely independent. No more API calls, no more tokens, no more waiting for AI responses. Just pure, efficient automation.

## Environment Configuration

The extension uses a JSON-based environment configuration to manage LLM API keys:

- `.env.example`: Template showing the required structure (safe to commit)
- `.env`: Your actual configuration with real API keys (never commit this!)

Supported models:
- GPT-4 (OpenAI)
- GPT-3.5 (OpenAI)
- Deepseek

To use a different model, simply change the `active_model` in your `.env` file and provide the necessary API key.
If you want to add a custom model, please refer to the [llm_service.js](llm_service.js) file for the required structure.

## Contributing

Contributions are welcome! Please feel free to submit pull requests, create issues, or suggest improvements.
For any questions, please create an issue in the repository.
