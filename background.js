let OPENAI_API_KEY = null;

// Load the .env file
fetch('./.env')
  .then((response) => {
    if (!response.ok) {
      console.error("Error: Failed to load .env file");
      return;
    }
    return response.text();
  })
  .then((data) => {
    const envVariables = {};
    data.split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVariables[key.trim()] = value.trim();
      }
    });

    OPENAI_API_KEY = envVariables.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error("Error: OPENAI_API_KEY is not set in the .env file");
    } else {
      console.log("API Key loaded successfully.");
    }
  })
  .catch((error) => {
    console.error("Error loading .env file:", error);
  });

const SELENIUM_PROMPT = `Task Description: You are an advanced AI specialized in generating high-quality, robust Selenium automation scripts. Your task is to generate a Python Selenium script that mimics a series of user interactions based on the provided list of browser actions, XPaths, and input data.

The generated script must:
- Use Selenium's Python bindings
- Handle all interactions in a stable and reliable way
- Include appropriate waits and error handling
- Simulate realistic user behavior
- Handle page navigation and form submissions properly

Input Format Example:
\`\`\`json
[
  {
    "browserAction": "WINDOW_RESIZE",
    "width": 1440,
    "height": 812,
    "timestamp": 1736427817080,
    "currentUrl": "https://example.com/"
  },
  {
    "browserAction": "GO_TO_URL",
    "url": "https://example.com/",
    "timestamp": 1736427817080,
    "currentUrl": "https://example.com/"
  },
  {
    "browserAction": "INPUT",
    "xpath": [
      "//input[@name='search']",
      "/html/body/div/form/input"
    ],
    "content": "test query",
    "timestamp": 1736427820000,
    "currentUrl": "https://example.com/"
  },
  {
    "browserAction": "SET",
    "xpath": [
      "//input[@name='search']",
      "/html/body/div/form/input"
    ],
    "content": "test query",
    "timestamp": 1736427820100,
    "currentUrl": "https://example.com/"
  },
  {
    "browserAction": "CLICK",
    "xpath": [
      "//button[@type='submit']",
      "/html/body/div/form/button"
    ],
    "timestamp": 1736427821000,
    "currentUrl": "https://example.com/",
    "linkInfo": {
      "href": "https://example.com/search?q=test+query",
      "target": "",
      "onclick": false
    }
  },
  {
    "browserAction": "GO_TO_URL",
    "url": "https://example.com/search?q=test+query",
    "triggeredBy": "click",
    "timestamp": 1736427821001,
    "currentUrl": "https://example.com/"
  }
]
\`\`\`

Key Action Handling Guidelines:

1. Page Navigation:
   - Every action includes a currentUrl indicating where it should be performed
   - Before each action, verify browser is on the correct page
   - For click-triggered navigations:
     * When CLICK action has linkInfo, wait for navigation after click
     * Ignore following GO_TO_URL action with triggeredBy: "click"

2. Input Field Handling:
   - INPUT: Simulates human typing (character by character with delays)
   - SET: Directly sets value (like paste operations)
   - Form Submission:
     * For search/form inputs, check if submission is needed
     * After input completion, either:
       - Click submit button if found
       - Press Enter key if in a form field
     * Wait for navigation if URL changes

3. General Action Sequence:
   - Navigate to initial URL
   - Resize window if specified
   - For each action:
     * Verify current page
     * Execute action with appropriate waits
     * Handle any resulting navigation
     * Skip redundant actions (e.g., INPUT followed by SET on same field)

Output Structure:
\`\`\`python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time

def verify_url(driver, expected_url, timeout=10):
    """Verify current URL matches expected URL."""
    try:
        WebDriverWait(driver, timeout).until(
            lambda driver: driver.current_url == expected_url
        )
        return True
    except Exception as e:
        print(f"URL verification failed. Expected: {expected_url}, Got: {driver.current_url}")
        return False

def wait_for_navigation(driver, timeout=10):
    """Wait for page load to complete."""
    try:
        WebDriverWait(driver, timeout).until(
            lambda driver: driver.execute_script('return document.readyState') == 'complete'
        )
    except Exception as e:
        print(f"Navigation wait timeout: {e}")

def handle_form_submission(driver, element, xpath, timeout=10):
    """Try to submit a form after input."""
    try:
        current_url = driver.current_url
        
        # First try to find and click a submit button
        submit_patterns = [
            f"//form[contains(., '{xpath}')]//button[@type='submit']",
            f"//form[contains(., '{xpath}')]//input[@type='submit']",
            f"{xpath}/ancestor::form//button",
            f"{xpath}/following::button[contains(@class, 'search')]",
            "//button[@type='submit']",
            "//input[@type='submit']"
        ]
        
        for pattern in submit_patterns:
            try:
                submit = WebDriverWait(driver, 1).until(
                    EC.element_to_be_clickable((By.XPATH, pattern))
                )
                submit.click()
                break
            except:
                continue
        
        # If no submit button found or clicked, try pressing Enter
        if driver.current_url == current_url:
            element.send_keys(Keys.ENTER)
        
        # Wait for potential navigation
        try:
            WebDriverWait(driver, timeout).until(
                lambda driver: driver.current_url != current_url
            )
            wait_for_navigation(driver)
        except:
            pass  # Not all form submissions result in navigation
            
    except Exception as e:
        print(f"Form submission handling failed: {e}")

def click_element(driver, xpaths, link_info=None, timeout=10):
    """Click element and handle potential navigation."""
    for xpath in xpaths:
        try:
            element = WebDriverWait(driver, timeout).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            element.click()
            print(f"Clicked: {xpath}")
            
            if link_info and link_info.get('href'):
                wait_for_navigation(driver)
            return True
        except Exception as e:
            continue
    print("No clickable element found")
    return False

def input_text(driver, xpaths, text, simulate_typing=True, timeout=10):
    """Handle text input with optional typing simulation."""
    for xpath in xpaths:
        try:
            element = WebDriverWait(driver, timeout).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            element.clear()
            
            if simulate_typing:
                for char in text:
                    element.send_keys(char)
                    time.sleep(0.1)
            else:
                element.send_keys(text)
            
            # Handle potential form submission
            handle_form_submission(driver, element, xpath)
            return True
            
        except Exception as e:
            continue
    print("No input field found")
    return False

def execute_actions(driver):
    previous_action = None
    
    # Initial navigation
    if actions[0]['currentUrl']:
        driver.get(actions[0]['currentUrl'])
        wait_for_navigation(driver)
    
    for action in actions:
        # Skip click-triggered navigations
        if action['browserAction'] == "GO_TO_URL" and action.get('triggeredBy') == 'click':
            continue
            
        # Skip INPUT if followed by SET on same element
        if (previous_action and 
            previous_action['browserAction'] == "INPUT" and
            action['browserAction'] == "SET" and
            previous_action['xpath'][0] == action['xpath'][0]):
            continue
        
        # Verify correct page
        if not verify_url(driver, action['currentUrl']):
            driver.get(action['currentUrl'])
            wait_for_navigation(driver)
        
        # Execute action
        if action['browserAction'] == "WINDOW_RESIZE":
            driver.set_window_size(action['width'], action['height'])
        elif action['browserAction'] == "GO_TO_URL":
            driver.get(action['url'])
            wait_for_navigation(driver)
        elif action['browserAction'] == "CLICK":
            click_element(driver, action['xpath'], action.get('linkInfo'))
        elif action['browserAction'] == "INPUT":
            input_text(driver, action['xpath'], action['content'], True)
        elif action['browserAction'] == "SET":
            input_text(driver, action['xpath'], action['content'], False)
        elif action['browserAction'] == "SCROLL":
            driver.execute_script(f"window.scrollTo({action['left']}, {action['top']});")
        
        time.sleep(0.5)  # Small delay between actions
        previous_action = action

if __name__ == "__main__":
    driver = webdriver.Chrome()
    try:
        execute_actions(driver)
    finally:
        driver.quit()
\`\`\`

Convert the following browser tracking log to a Python Selenium script:
`

window.gotourl_browseraction = "GO_TO_URL";

window.click_browseraction = "CLICK";

window.dblClick_browseraction = "DOUBLE_CLICK";

window.set_browseraction = "SET";

window.scroll_browseraction = "SCROLL";

window.windowresize_browseraction = "WINDOW_RESIZE";

window.successconditionequals_browseraction = "SUCCESS_CONDITION_EQUALS";

window.successconditioncontains_browseraction = "SUCCESS_CONDITION_CONTAINS";

window.debouncer_time = 100;

window.xpathOfSelectedElement = "";

window.contentOfSelectedElement = "";

window.recState;

window.dimension_w = "";

window.dimension_h = "";

window.scroll_top = "";

window.scroll_left = "";

window.actions = [];

window.keypress_browseraction = "KEY_PRESS";

window.input_browseraction = "INPUT";

window.current_url = "";

chrome.history.onVisited.addListener(function (a) {
    if (window.recState) {
        // Update the current URL
        window.current_url = a.url;

        // Check if the URL was typed directly
        chrome.history.getVisits({ url: a.url }, function (b) {
            var lastVisit = b[b.length - 1];
            if (lastVisit.transition === "typed") {
                console.log("Go to url [" + a.url + "]");
                pushAction({
                    browserAction: window.gotourl_browseraction,
                    url: a.url
                });
            }
        });
    }
});

chrome.browserAction.onClicked.addListener(function(a) {
    toggleRec();
});

chrome.runtime.onMessage.addListener(function(a, b, c) {
    window.xpathOfSelectedElement = a.xPath;
    switch (a.message) {
      case "onContextMenuClick":
        window.contentOfSelectedElement = a.content;
        break;

        case "onClick":
            console.log("Click on element [" + window.xpathOfSelectedElement + "]");
            let clickAction = {
                browserAction: window.click_browseraction,
                xpath: window.xpathOfSelectedElement
            };
            
            // Add link info if available
            if (a.linkInfo) {
                clickAction.linkInfo = a.linkInfo;
                // Create a GO_TO_URL action at the same time
                if (a.linkInfo.href && !a.linkInfo.target) {  // Ignore links with target="_blank"
                    pushAction({
                        browserAction: window.gotourl_browseraction,
                        url: a.linkInfo.href,
                        triggeredBy: 'click'
                    });
                }
            }
            
            pushAction(clickAction);
            break;

      case "onDblClick":
        console.log("DblClick on element [" + window.xpathOfSelectedElement + "]");
        pushAction({
            browserAction: window.dblClick_browseraction,
            xpath: window.xpathOfSelectedElement
        });
        break;

      case "onChange":
        window.contentOfSelectedElement = a.content;
        console.log("Set value [" + window.contentOfSelectedElement + "] on element [" + window.xpathOfSelectedElement + "]");
        pushAction({
            browserAction: window.set_browseraction,
            xpath: window.xpathOfSelectedElement,
            content: window.contentOfSelectedElement
        });
        break;

      case "onScroll":
        window.contentOfSelectedElement = a.content;
        console.log("scroll on element xpath [" + window.xpathOfSelectedElement + "], top [" + a.top + "] left[" + a.left + "]");
        pushAction({
            browserAction: window.scroll_browseraction,
            xpath: window.xpathOfSelectedElement,
            top: a.top - window.scroll_top,
            left: a.left - window.scroll_left
        });
        break;

      case "recState":
        c({
            recState: window.recState
        });
        break;
    //   case "onKeyPress":
    //     console.log("Key press [" + a.key + "] on element [" + window.xpathOfSelectedElement + "]");
    //     pushAction({
    //         browserAction: window.keypress_browseraction,
    //         xpath: window.xpathOfSelectedElement,
    //         key: a.key
    //     });
    //     break;
    
      case "onInput":
        console.log("Input value [" + a.content + "] on element [" + window.xpathOfSelectedElement + "]");
        pushAction({
            browserAction: window.input_browseraction,
            xpath: window.xpathOfSelectedElement,
            content: a.content
        });
        break;
      default:
        break;
    }
});

function compareAction(a, b) {
    if (a !== undefined && b !== undefined) {
        switch (a.browserAction) {
          case window.gotourl_browseraction:
            if (a.browserAction === window.gotourl_browseraction && a.url === b.url && b.timestamp - a.timestamp <= window.debouncer_time) {
                return 0;
            } else {
                return 1;
            }
            break;

          case window.scroll_browseraction:
            return 1;
            break;

          case window.windowresize_browseraction:
            if (a.browserAction === window.windowresize_browseraction && a.width === b.width && a.height === b.height && b.timestamp - a.timestamp <= window.debouncer_time) {
                return 0;
            } else {
                return 1;
            }
            break;

          case window.successconditionequals_browseraction:
          case window.successconditioncontains_browseraction:
            if (a.browserAction === b.browserAction) {
                return 0;
            } else {
                return 1;
            }
            break;

          default:
            if (a.browserAction === b.browserAction && a.xpath[0] === b.xpath[0] && a.content === b.content && b.timestamp - a.timestamp <= window.debouncer_time) {
                return 0;
            } else {
                return 1;
            }
            break;
        }
    } else {
        return 1;
    }
}

function pushAction(a) {
    chrome.windows.getCurrent(function(b) {
        a.timestamp = Date.now();

        a.currentUrl = window.current_url; // add current url to action
        var c = window.actions[window.actions.length - 1];
        if (b.width !== window.dimension_w || b.height !== window.dimension_h) {
            console.log("resize window: [" + b.width + "x" + b.height + "]");
            window.dimension_w = b.width;
            window.dimension_h = b.height;
            if (compareAction(c, a) === 0) {
                console.log("Duplicated action [" + c.browserAction + "] at the same element, ignore it!");
            } else {
                window.actions.push({
                    browserAction: window.windowresize_browseraction,
                    width: window.dimension_w,
                    height: window.dimension_h,
                    timestamp: Date.now(),
                    currentUrl: window.current_url
                });
            }
        }
        if (a.browserAction === window.scroll_browseraction) {
            if (window.actions[window.actions.length - 1]) {
                if (window.actions[window.actions.length - 1].browserAction === window.scroll_browseraction) {
                    console.log("remove previous scroll in favour of the last one");
                    window.actions.pop();
                }
            }
        }

        // Special handling for input actions with same xpath
        if (a.browserAction === window.input_browseraction && c && 
            c.browserAction === window.input_browseraction &&
            c.xpath[0] === a.xpath[0]) {
            console.log("Update content for input action on same element");
            c.content = a.content;
            c.timestamp = Date.now();
            c.currentUrl = window.current_url;
        }
        // Normal handling for other actions
        else if (compareAction(c, a) === 0) {
            console.log("Duplicated action [" + c.browserAction + "] at the same element, ignore it!");
        } else {
            a.timestamp = Date.now();
            window.actions.push(a);
        }

        console.log("reset xpathOfSelectedElement and contentOfSelectedElement");
        window.xpathOfSelectedElement = "";
        window.contentOfSelectedElement = "";
        buildContextMenu();
    });
}

function fixXpathDoubleQuoteIssues(xpathString) {
    // avoid unescaped double quotes in Python strings
    return xpathString.replace(/(\[@[a-zA-Z]+)="([^"]*)"]/g, "$1='$2']");
}

function convertToSelenium(trackingLog) {
    // Create xpath mapping
    const xpathMap = {};
    let xpathCounter = 1;
    
    // Create a deep copy of tracking log and replace xpaths with placeholders
    const simplifiedLog = trackingLog.map(action => {
        const simplifiedAction = {...action};
        
        // Handle actions with xpath property
        if (simplifiedAction.xpath) {
            // Ensure xpath is always an array
            const xpathArray = Array.isArray(simplifiedAction.xpath) ? 
                simplifiedAction.xpath : [simplifiedAction.xpath];
            
            // Store original xpaths in map and replace with placeholders
            simplifiedAction.xpath = xpathArray.map(xpath => {
                const fixedXpath = fixXpathDoubleQuoteIssues(xpath);
                const placeholder = `XPATH-#${xpathCounter}`;
                xpathMap[placeholder] = fixedXpath;
                xpathCounter++;
                return placeholder;
            });
        }
        // Ensure URL is included in each action
        if (!simplifiedAction.url) {
            simplifiedAction.url = window.currentUrl;
        }
        
        return simplifiedAction;
    });

    console.log(JSON.stringify(simplifiedLog, null, 2));

    // Save the tracking log as JSON with proper MIME type
    const jsonBlob = new Blob([JSON.stringify(trackingLog, null, 2)], { 
        type: 'application/json'  // Set correct MIME type for JSON
    });

    const requestBody = {
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: SELENIUM_PROMPT
            },
            {
                role: "user",
                content: JSON.stringify(simplifiedLog, null, 2)
            }
        ]
    };
    
    // Function to generate code and manage popup
    function generateCodeWithPopup(jsonBlob, requestBody, xpathMap, OPENAI_API_KEY) {
        // Create a small popup window with better styling
        const popupHTML = `
            <html>
            <head>
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
                    .error {
                        color: #dc3545;
                        background: #fff5f5;
                    }
                    .error h2 {
                        color: #dc3545;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2><div class="spinner"></div>Generating Code</h2>
                    <p>Please wait while GPT processes your actions...</p>
                </div>
            </body>
            </html>
        `;

        const errorHTML = `
            <html>
            <head>
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
            url: 'data:text/html,' + encodeURIComponent(popupHTML),
            type: 'popup',
            width: 360,
            height: 240
        }, (popupWindow) => {
    
            const popupId = popupWindow.id;

            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                if (!response.ok) {
                    console.error('Error generating code:', error);
                    // Show error message with better styling
                    chrome.windows.update(popupId, {
                        url: 'data:text/html,' + encodeURIComponent(errorHTML)
                    });
                    chrome.downloads.download({
                        url: URL.createObjectURL(jsonBlob),
                        filename: 'tracking_log.json',
                        saveAs: true,
                        headers: [{  // Add headers to ensure proper file type
                            name: 'Content-Type',
                            value: 'application/json'
                        }]
                    });
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                let pythonCode = data.choices[0].message.content;

                // Extract code between ```python and ``` markers if present
                const codeMatch = pythonCode.match(/```python\n([\s\S]*?)```/);
                if (codeMatch) {
                    pythonCode = codeMatch[1];
                }

                // Replace placeholders with actual xpaths
                Object.entries(xpathMap).forEach(([placeholder, xpath]) => {
                    pythonCode = pythonCode.replace(new RegExp(placeholder, 'g'), xpath);
                });

                // Create a new file with the Python code
                const blob = new Blob([pythonCode], { 
                    type: 'application/x-python' // Set correct MIME type
                });
                
                chrome.downloads.download({
                    url: URL.createObjectURL(jsonBlob),
                    filename: 'tracking_log.json',
                    saveAs: true,
                    headers: [{  // Add headers to ensure proper file type
                        name: 'Content-Type',
                        value: 'application/json'
                    }]
                });

                chrome.downloads.download({
                    url: URL.createObjectURL(blob),
                    filename: 'selenium_test.py',
                    saveAs: true
                });

                console.log('Generated Code:', pythonCode);
            })
            .catch(error => {
                console.error('Error generating code:', error);
                // Show error message with better styling
                chrome.windows.update(popupId, {
                    url: 'data:text/html,' + encodeURIComponent(errorHTML)
                });
                chrome.downloads.download({
                    url: URL.createObjectURL(jsonBlob),
                    filename: 'tracking_log.json',
                    saveAs: true,
                    headers: [{  // Add headers to ensure proper file type
                        name: 'Content-Type',
                        value: 'application/json'
                    }]
                });
            })
            .finally(() => {
                setTimeout(() => {
                    chrome.windows.remove(popupId);
                }, 2000);
            });
        });
    }

    generateCodeWithPopup(jsonBlob, requestBody, xpathMap, OPENAI_API_KEY);
}

function toggleRec() {
    if (window.recState) {
        if (window.actions.length > 0) {
            if (window.actions[window.actions.length - 1].browserAction.includes("SUCCESS_CONDITION_")) {
                var a = confirm(chrome.i18n.getMessage("onStopRequest_msg"));
                if (a) {
                    chrome.browserAction.setBadgeText({
                        text: ""
                    });
                    console.log("Stop recording");
                    // Convert and download both Python and JSON
                    // convertToSelenium(window.actions);
                    scriptCode = convertToSelenium(window.actions);
                    console.log(scriptCode);
                    console.log("reset window dimension");
                    window.dimension_w = "";
                    window.dimension_h = "";
                    window.recState = !window.recState;
                }
            } else {
                var b = confirm(chrome.i18n.getMessage("onStopRequest_noSuccessCondition_msg"));
                if (b) {
                    chrome.browserAction.setBadgeText({
                        text: ""
                    });
                    console.log("Stop recording");
                    // Convert and download both Python and JSON
                    // convertToSelenium(window.actions);
                    scriptCode = convertToSelenium(window.actions);
                    console.log(scriptCode);
                    console.log("reset window dimension");
                    window.dimension_w = "";
                    window.dimension_h = "";
                    window.recState = !window.recState;
                }
            }
        } else {
            chrome.browserAction.setBadgeText({
                text: ""
            });
            console.log("Stop recording");
            console.log(JSON.stringify(window.actions));
            console.log("reset window dimension");
            window.dimension_w = "";
            window.dimension_h = "";
            window.recState = !window.recState;
        }
    } else {
        // Reset actions and start recording
        window.actions = [];
        chrome.browserAction.setBadgeText({
            text: "rec"
        });
        console.log("Start recording...");
        
        // Get the current URL and add it as the first action
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                window.current_url = tabs[0].url;
                window.recState = true;  // Set recording state to true
            }
        });
    }
    buildContextMenu();
}

function isSuccessConditionEnabled() {
    if (window.actions[window.actions.length - 1].browserAction === window.successconditionequals_browseraction || window.actions[window.actions.length - 1].browserAction === window.successconditioncontains_browseraction) {
        return false;
    } else {
        return true;
    }
}

function buildContextMenu() {
    chrome.contextMenus.removeAll();
    if (window.recState) {
        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("ctxMenu_RecStateStop"),
            type: "normal",
            id: "recStateStop",
            contexts: [ "all" ]
        });
        if (window.actions.length > 0) {
            chrome.contextMenus.create({
                title: chrome.i18n.getMessage("ctxMenu_SuccessConditionMain"),
                type: "normal",
                id: "recSuccessCondition",
                contexts: [ "all" ],
                enabled: isSuccessConditionEnabled()
            });
            chrome.contextMenus.create({
                parentId: "recSuccessCondition",
                title: chrome.i18n.getMessage("ctxMenu_SuccessCondition_Equals"),
                type: "normal",
                id: "recSuccessConditionContentEquals",
                contexts: [ "all" ]
            });
            chrome.contextMenus.create({
                parentId: "recSuccessCondition",
                title: chrome.i18n.getMessage("ctxMenu_SuccessCondition_Contains"),
                type: "normal",
                id: "recSuccessConditionContentContains",
                contexts: [ "all" ]
            });
            chrome.contextMenus.create({
                title: chrome.i18n.getMessage("ctxMenu_ChangeLastXpathAction"),
                type: "normal",
                id: "changeLastXpathAction",
                contexts: [ "all" ]
            });
            chrome.contextMenus.create({
                title: chrome.i18n.getMessage("ctxMenu_RemoveLastAction"),
                type: "normal",
                id: "removeLastAction",
                contexts: [ "all" ]
            });
            if (window.actions[window.actions.length - 1].xpath && window.actions[window.actions.length - 1].xpath.length > 1) {
                chrome.contextMenus.create({
                    title: chrome.i18n.getMessage("ctxMenu_ChangeXpathElementExtrator"),
                    type: "normal",
                    id: "changeXpathElementExtrator",
                    contexts: [ "all" ]
                });
                window.actions[window.actions.length - 1].xpath.forEach(function(a, b) {
                    chrome.contextMenus.create({
                        parentId: "changeXpathElementExtrator",
                        title: window.actions[window.actions.length - 1].browserAction + ": " + a,
                        type: "radio",
                        checked: b === 0,
                        id: "changeXpathElementExtrator_" + b,
                        contexts: [ "all" ]
                    });
                });
            }
        }
    } else {
        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("ctxMenu_RecStateStart"),
            type: "normal",
            id: "recStateStart",
            contexts: [ "all" ]
        });
    }
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("ctxMenu_ShowXpathSelectedElement"),
        type: "normal",
        id: "showXpathSelectedElement",
        contexts: [ "all" ]
    });
}

function conttextMenuHandler(a, b) {
    switch (a.menuItemId) {
      case "recStateStart":
        toggleRec();
        break;

      case "recStateStop":
        toggleRec();
        break;

      case "recSuccessConditionContentContains":
        var c = prompt(chrome.i18n.getMessage("ctxMenu_SuccessCondition_Contains_prompt"), window.contentOfSelectedElement);
        if (c !== null || c === true) {
            window.contentOfSelectedElement = c;
            console.log("Success condition on element (" + window.xpathOfSelectedElement + ") that contains [" + window.contentOfSelectedElement + "]");
            pushAction({
                browserAction: window.successconditioncontains_browseraction,
                xpath: window.xpathOfSelectedElement,
                content: window.contentOfSelectedElement
            });
        }
        break;

      case "recSuccessConditionContentEquals":
        var c = prompt(chrome.i18n.getMessage("ctxMenu_SuccessCondition_Equals_prompt"), window.contentOfSelectedElement);
        if (c !== null || c === true) {
            window.contentOfSelectedElement = c;
            console.log("Success condition on element (" + window.xpathOfSelectedElement + ") that equals [" + window.contentOfSelectedElement + "]");
            pushAction({
                browserAction: window.successconditionequals_browseraction,
                xpath: window.xpathOfSelectedElement,
                content: window.contentOfSelectedElement
            });
        }
        break;

      case "changeLastXpathAction":
        console.log("change last recorded xpath action");
        var d = prompt(chrome.i18n.getMessage("ctxMenu_ChangeLastXpathAction"), window.actions[window.actions.length - 1].xpath[0]);
        if (d !== null) {
            window.actions[window.actions.length - 1].xpath[0] = d;
        }
        break;

      case "removeLastAction":
        console.log("remove last recorded action");
        window.actions.pop();
        break;

      case "showXpathSelectedElement":
        var e = "";
        if (window.xpathOfSelectedElement.length > 1) {
            window.xpathOfSelectedElement.forEach(function(a, b) {
                e += " " + (b + 1) + ": " + a;
            });
        } else if (window.xpathOfSelectedElement.length === 1) {
            e = window.xpathOfSelectedElement[0];
        } else {
            e = chrome.i18n.getMessage("noXpathForElement_msg");
        }
        prompt(chrome.i18n.getMessage("ctxMenu_ShowXpathSelectedElement"), e);
        break;

      default:
        if (a.menuItemId.startsWith("changeXpathElementExtrator_")) {
            var f = a.menuItemId.substring(a.menuItemId.indexOf("_") + 1);
            var g = window.actions[window.actions.length - 1].xpath[f];
            window.actions[window.actions.length - 1].xpath.splice(f, 1);
            window.actions[window.actions.length - 1].xpath.splice(0, 0, g);
        } else {
            console.log("No reg action!");
        }
        break;
    }
    buildContextMenu();
}

chrome.contextMenus.onClicked.addListener(conttextMenuHandler);

chrome.runtime.onInstalled.addListener(function() {
    chrome.browserAction.setBadgeBackgroundColor({
        color: "#BF0B0B"
    });
    buildContextMenu();
});