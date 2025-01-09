# AutoMouser

<p align="center">
  <img src="icon.png" alt="Icon" width="256">
</p>

AutoMouser is a Chrome extension that intelligently tracks user interactions and automatically generates Selenium test code using OpenAI's GPT model. It simplifies the process of creating automated tests by recording your browser actions and converting them into robust, maintainable Python Selenium scripts. This project is built upon the work in [bitmarte/selenium-rfc-chrome-extension](https://github.com/bitmarte/selenium-rfc-chrome-extension).

## Features

- 🎯 Real-time interaction tracking (clicks, inputs, scrolls)
- 🤖 Automatic Selenium Python code generation
- 📝 Smart input consolidation
- 🔄 Window resize detection
- 💾 JSON action log export
- ✨ Multiple XPath generation strategies
- 🎨 Clean, well-structured code output

## Installation

1. Clone this repository or download the source code
2. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```
3. Replace the `SELENIUM_PROMPT` in `background.js` with your desired prompt template if needed.
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right
6. Click "Load unpacked" and select the extension directory

## Usage

1. Click the AutoMouser icon in your Chrome toolbar to start recording
2. Perform the actions you want to automate
3. Click the icon again to stop recording and generate code
4. Two files will be downloaded:
   - `tracking_log.json`: Raw interaction data
   - `selenium_test.py`: Generated Selenium test script
5. Check and run the generated Selenium code in your Python environment!

## Contributing

Contributions are welcome! Please feel free to submit pull requests, create issues, or suggest improvements.
For any questions, please create an issue in the repository.
