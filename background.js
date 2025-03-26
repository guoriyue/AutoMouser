// Import other modules
import * as popupManager from './popup_manager.js';
import * as llmService from './llm_service.js';
import * as prompt from './prompt.js';

// Main background script code
console.log('Background service worker started');

// Global state - using script scope variables instead of window properties
let LLM_CONFIG = null;
let xpathOfSelectedElement = "";
let contentOfSelectedElement = "";
let recState = false;
let dimension_w = "";
let dimension_h = "";
let scroll_top = "";
let scroll_left = "";
let actions = [];

// Action types - as constants instead of window properties
const gotourl_browseraction = "GO_TO_URL";
const click_browseraction = "CLICK";
const dblClick_browseraction = "DOUBLE_CLICK";
const set_browseraction = "SET";
const scroll_browseraction = "SCROLL";
const windowresize_browseraction = "WINDOW_RESIZE";
const successconditionequals_browseraction = "SUCCESS_CONDITION_EQUALS";
const successconditioncontains_browseraction = "SUCCESS_CONDITION_CONTAINS";
const debouncer_time = 100;
const keypress_browseraction = "KEY_PRESS";
const input_browseraction = "INPUT";

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
    try {
      // Parse JSON configuration from .env
      LLM_CONFIG = JSON.parse(data);
      
      if (!LLM_CONFIG.active_model) {
        console.error("Error: active_model is not set in the .env file");
      } else if (!LLM_CONFIG.models?.[LLM_CONFIG.active_model]?.api_key) {
        console.error(`Error: API key not found for model ${LLM_CONFIG.active_model}`);
      } else {
        console.log("LLM configuration loaded successfully.");
      }
    } catch (e) {
      console.error("Error parsing .env JSON:", e);
    }
  })
  .catch((error) => {
    console.error("Error loading .env file:", error);
  });

chrome.history.onVisited.addListener(function(a) {
    if (recState) {
        chrome.history.getVisits({
            url: a.url
        }, function(b) {
            var c = b[b.length - 1];
            if (c.transition === "typed") {
                console.log("Go to url [" + a.url + "]");
                pushAction({
                    browserAction: gotourl_browseraction,
                    url: a.url
                });
            }
        });
    }
});

// Update from browserAction to action (for MV3)
chrome.action.onClicked.addListener(function(a) {
    toggleRec();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "recState") {
        sendResponse({
            recState: recState
        });
        return true; // Important: Keep the message channel open for async response
    }
    xpathOfSelectedElement = request.xPath;
    switch (request.message) {
      case "onContextMenuClick":
        contentOfSelectedElement = request.content;
        break;

      case "onClick":
        console.log("Click on element [" + xpathOfSelectedElement + "]");
        pushAction({
            browserAction: click_browseraction,
            xpath: xpathOfSelectedElement
        });
        break;

      case "onDblClick":
        console.log("DblClick on element [" + xpathOfSelectedElement + "]");
        pushAction({
            browserAction: dblClick_browseraction,
            xpath: xpathOfSelectedElement
        });
        break;

      case "onChange":
        contentOfSelectedElement = request.content;
        console.log("Set value [" + contentOfSelectedElement + "] on element [" + xpathOfSelectedElement + "]");
        pushAction({
            browserAction: set_browseraction,
            xpath: xpathOfSelectedElement,
            content: contentOfSelectedElement
        });
        break;

      case "onScroll":
        contentOfSelectedElement = request.content;
        console.log("scroll on element xpath [" + xpathOfSelectedElement + "], top [" + request.top + "] left[" + request.left + "]");
        pushAction({
            browserAction: scroll_browseraction,
            xpath: xpathOfSelectedElement,
            top: request.top - scroll_top,
            left: request.left - scroll_left
        });
        break;

      case "onInput":
        console.log("Input value [" + request.content + "] on element [" + xpathOfSelectedElement + "]");
        pushAction({
            browserAction: input_browseraction,
            xpath: xpathOfSelectedElement,
            content: request.content
        });
        break;
      default:
        break;
    }
});

function compareAction(a, b) {
    if (a !== undefined && b !== undefined) {
        switch (a.browserAction) {
          case gotourl_browseraction:
            if (a.browserAction === gotourl_browseraction && a.url === b.url && b.timestamp - a.timestamp <= debouncer_time) {
                return 0;
            } else {
                return 1;
            }
            break;

          case scroll_browseraction:
            return 1;
            break;

          case windowresize_browseraction:
            if (a.browserAction === windowresize_browseraction && a.width === b.width && a.height === b.height && b.timestamp - a.timestamp <= debouncer_time) {
                return 0;
            } else {
                return 1;
            }
            break;

          case successconditionequals_browseraction:
          case successconditioncontains_browseraction:
            if (a.browserAction === b.browserAction) {
                return 0;
            } else {
                return 1;
            }
            break;

          default:
            if (a.browserAction === b.browserAction && a.xpath[0] === b.xpath[0] && a.content === b.content && b.timestamp - a.timestamp <= debouncer_time) {
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
        var c = actions[actions.length - 1];
        if (b.width !== dimension_w || b.height !== dimension_h) {
            console.log("resize window: [" + b.width + "x" + b.height + "]");
            dimension_w = b.width;
            dimension_h = b.height;
            if (compareAction(c, a) === 0) {
                console.log("Duplicated action [" + c.browserAction + "] at the same element, ignore it!");
            } else {
                actions.push({
                    browserAction: windowresize_browseraction,
                    width: dimension_w,
                    height: dimension_h,
                    timestamp: Date.now()
                });
            }
        }
        if (a.browserAction === scroll_browseraction) {
            if (actions[actions.length - 1]) {
                if (actions[actions.length - 1].browserAction === scroll_browseraction) {
                    console.log("remove previous scroll in favour of the last one");
                    actions.pop();
                }
            }
        }

        // Special handling for input actions with same xpath
        if (a.browserAction === input_browseraction && c && 
            c.browserAction === input_browseraction &&
            c.xpath[0] === a.xpath[0]) {
            console.log("Update content for input action on same element");
            c.content = a.content;
            c.timestamp = Date.now();
        }
        // Normal handling for other actions
        else if (compareAction(c, a) === 0) {
            console.log("Duplicated action [" + c.browserAction + "] at the same element, ignore it!");
        } else {
            a.timestamp = Date.now();
            actions.push(a);
        }

        console.log("reset xpathOfSelectedElement and contentOfSelectedElement");
        xpathOfSelectedElement = "";
        contentOfSelectedElement = "";
        buildContextMenu();
    });
}

function fixXpathDoubleQuoteIssues(xpathString) {
    // avoid unescaped double quotes in Python strings
    return xpathString.replace(/(\[@[a-zA-Z]+)="([^"]*)"]/g, "$1='$2']");
}

function convertToSelenium(trackingLog) {
    const xpathMap = {};
    let xpathCounter = 1;
    
    const simplifiedLog = trackingLog.map(action => {
        const simplifiedAction = {...action};
        
        if (simplifiedAction.xpath) {
            const xpathArray = Array.isArray(simplifiedAction.xpath) ? 
                simplifiedAction.xpath : [simplifiedAction.xpath];
            
            simplifiedAction.xpath = xpathArray.map(xpath => {
                const fixedXpath = fixXpathDoubleQuoteIssues(xpath);
                const placeholder = `XPATH-#${xpathCounter}`;
                xpathMap[placeholder] = fixedXpath;
                xpathCounter++;
                return placeholder;
            });
        }
        
        return simplifiedAction;
    });

    console.log(JSON.stringify(simplifiedLog, null, 2));

    const jsonBlob = new Blob([JSON.stringify(trackingLog, null, 2)], { 
        type: 'application/json'
    });

    const requestBody = {
        messages: [
            {
                role: "system",
                content: prompt.SELENIUM_PROMPT
            },
            {
                role: "user",
                content: JSON.stringify(simplifiedLog, null, 2)
            }
        ]
    };
    
    popupManager.generateCodeWithPopup(jsonBlob, requestBody, xpathMap, LLM_CONFIG);
}

function toggleRec() {
    if (recState) {
        if (actions.length > 0) {
            if (actions[actions.length - 1].browserAction.includes("SUCCESS_CONDITION_")) {
                // Replace confirm dialog with notification
                chrome.action.setBadgeText({ text: "" });
                console.log("Stop recording");
                convertToSelenium(actions);
                console.log("reset window dimension");
                dimension_w = "";
                dimension_h = "";
                recState = !recState;
                
                // Show notification instead of confirm dialog
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'Recording Stopped',
                    message: 'Recording stopped and test code is being generated.',
                    priority: 2
                });
            } else {
                // Replace confirm dialog with notification
                chrome.action.setBadgeText({ text: "" });
                console.log("Stop recording");
                convertToSelenium(actions);
                console.log("reset window dimension");
                dimension_w = "";
                dimension_h = "";
                recState = !recState;
                
                // Show notification instead of confirm dialog
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'Recording Stopped (No Success Condition)',
                    message: 'Recording stopped without success condition. Test code is being generated.',
                    priority: 2
                });
            }
        } else {
            // Updated from browserAction to action (for MV3)
            chrome.action.setBadgeText({
                text: ""
            });
            console.log("Stop recording");
            console.log(JSON.stringify(actions));
            console.log("reset window dimension");
            dimension_w = "";
            dimension_h = "";
            recState = !recState;
        }
    } else {
        actions = [];
        // Updated from browserAction to action (for MV3)
        chrome.action.setBadgeText({
            text: "rec"
        });
        console.log("Start recording...");
        recState = !recState;
    }
    buildContextMenu();
}

function isSuccessConditionEnabled() {
    if (actions[actions.length - 1].browserAction === successconditionequals_browseraction || 
        actions[actions.length - 1].browserAction === successconditioncontains_browseraction) {
        return false;
    } else {
        return true;
    }
}

function buildContextMenu() {
    chrome.contextMenus.removeAll();
    if (recState) {
        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("ctxMenu_RecStateStop"),
            type: "normal",
            id: "recStateStop",
            contexts: [ "all" ]
        });
        if (actions.length > 0) {
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
            
            // Fix for the xpath array issue
            if (actions.length > 0 && actions[actions.length - 1].xpath) {
                // Ensure xpath is always an array
                if (!Array.isArray(actions[actions.length - 1].xpath)) {
                    actions[actions.length - 1].xpath = [actions[actions.length - 1].xpath];
                }
                
                // Only create the submenu if we have multiple XPaths
                if (actions[actions.length - 1].xpath.length > 1) {
                    chrome.contextMenus.create({
                        title: chrome.i18n.getMessage("ctxMenu_ChangeXpathElementExtrator"),
                        type: "normal",
                        id: "changeXpathElementExtrator",
                        contexts: [ "all" ]
                    });
                    
                    // Now create the submenu items
                    actions[actions.length - 1].xpath.forEach((xpath, index) => {
                        chrome.contextMenus.create({
                            parentId: "changeXpathElementExtrator",
                            title: actions[actions.length - 1].browserAction + ": " + xpath,
                            type: "radio",
                            checked: index === 0,
                            id: "changeXpathElementExtrator_" + index,
                            contexts: [ "all" ]
                        });
                    });
                }
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
        // Replace prompt with a custom popup using chrome.windows.create
        createInputPopup("Success Condition (Contains)", contentOfSelectedElement || "", (newValue) => {
            if (newValue !== null) {
                contentOfSelectedElement = newValue;
                console.log("Success condition on element (" + xpathOfSelectedElement + ") that contains [" + contentOfSelectedElement + "]");
                pushAction({
                    browserAction: successconditioncontains_browseraction,
                    xpath: xpathOfSelectedElement,
                    content: contentOfSelectedElement
                });
            }
        });
        break;

      case "recSuccessConditionContentEquals":
        // Replace prompt with a custom popup
        createInputPopup("Success Condition (Equals)", contentOfSelectedElement || "", (newValue) => {
            if (newValue !== null) {
                contentOfSelectedElement = newValue;
                console.log("Success condition on element (" + xpathOfSelectedElement + ") that equals [" + contentOfSelectedElement + "]");
                pushAction({
                    browserAction: successconditionequals_browseraction,
                    xpath: xpathOfSelectedElement,
                    content: contentOfSelectedElement
                });
            }
        });
        break;

      case "changeLastXpathAction":
        console.log("change last recorded xpath action");
        // Replace prompt with a custom popup
        createInputPopup("Change XPath", actions[actions.length - 1].xpath[0] || "", (newValue) => {
            if (newValue !== null) {
                actions[actions.length - 1].xpath[0] = newValue;
            }
        });
        break;

      case "removeLastAction":
        console.log("remove last recorded action");
        actions.pop();
        break;

      case "showXpathSelectedElement":
        var e = "";
        if (xpathOfSelectedElement.length > 1) {
            xpathOfSelectedElement.forEach(function(a, b) {
                e += " " + (b + 1) + ": " + a;
            });
        } else if (xpathOfSelectedElement.length === 1) {
            e = xpathOfSelectedElement[0];
        } else {
            e = chrome.i18n.getMessage("noXpathForElement_msg");
        }
        // Replace prompt with showInfoPopup
        showInfoPopup("Selected Element XPath", e);
        break;

      default:
        if (a.menuItemId.startsWith("changeXpathElementExtrator_")) {
            var f = a.menuItemId.substring(a.menuItemId.indexOf("_") + 1);
            var g = actions[actions.length - 1].xpath[f];
            actions[actions.length - 1].xpath.splice(f, 1);
            actions[actions.length - 1].xpath.splice(0, 0, g);
        } else {
            console.log("No reg action!");
        }
        break;
    }
    buildContextMenu();
}

chrome.contextMenus.onClicked.addListener(conttextMenuHandler);

chrome.runtime.onInstalled.addListener(function() {
    // Updated from browserAction to action (for MV3)
    chrome.action.setBadgeBackgroundColor({
        color: "#BF0B0B"
    });
    buildContextMenu();
});

// Add these new helper functions to create popups for user input and info display
function createInputPopup(title, defaultValue, callback) {
    const popupHTML = `
        <html>
        <head>
            <title>${title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                    padding: 20px;
                    width: 400px;
                }
                h2 {
                    margin-top: 0;
                    color: #333;
                }
                input {
                    width: 100%;
                    padding: 8px;
                    margin: 10px 0;
                    box-sizing: border-box;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                .buttons {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 15px;
                }
                button {
                    padding: 8px 16px;
                    margin-left: 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                #cancel {
                    background-color: #f1f1f1;
                    color: #333;
                }
                #submit {
                    background-color: #4285f4;
                    color: white;
                }
            </style>
        </head>
        <body>
            <h2>${title}</h2>
            <input type="text" id="inputValue" value="${defaultValue.replace(/"/g, '&quot;')}">
            <div class="buttons">
                <button id="cancel">Cancel</button>
                <button id="submit">OK</button>
            </div>
            <script>
                document.getElementById('submit').addEventListener('click', function() {
                    const value = document.getElementById('inputValue').value;
                    chrome.runtime.sendMessage({action: 'inputResponse', value: value});
                    window.close();
                });
                document.getElementById('cancel').addEventListener('click', function() {
                    chrome.runtime.sendMessage({action: 'inputResponse', value: null});
                    window.close();
                });
                // Also handle Enter key
                document.getElementById('inputValue').addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        const value = document.getElementById('inputValue').value;
                        chrome.runtime.sendMessage({action: 'inputResponse', value: value});
                        window.close();
                    }
                });
            </script>
        </body>
        </html>
    `;

    chrome.windows.create({
        url: 'data:text/html;charset=utf-8,' + encodeURIComponent(popupHTML),
        type: 'popup',
        width: 450,
        height: 200
    });

    // Set up a one-time message listener for the response
    const messageListener = function(message) {
        if (message.action === 'inputResponse') {
            chrome.runtime.onMessage.removeListener(messageListener);
            callback(message.value);
        }
    };

    chrome.runtime.onMessage.addListener(messageListener);
}

function showInfoPopup(title, content) {
    const popupHTML = `
        <html>
        <head>
            <title>${title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                    padding: 20px;
                    width: 500px;
                }
                h2 {
                    margin-top: 0;
                    color: #333;
                }
                .content {
                    background-color: #f5f5f5;
                    padding: 10px;
                    border-radius: 4px;
                    font-family: monospace;
                    white-space: pre-wrap;
                    word-break: break-all;
                    margin: 10px 0;
                    max-height: 200px;
                    overflow-y: auto;
                }
                button {
                    padding: 8px 16px;
                    background-color: #4285f4;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    float: right;
                }
            </style>
        </head>
        <body>
            <h2>${title}</h2>
            <div class="content">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <button onclick="window.close()">Close</button>
        </body>
        </html>
    `;

    chrome.windows.create({
        url: 'data:text/html;charset=utf-8,' + encodeURIComponent(popupHTML),
        type: 'popup',
        width: 550,
        height: 300
    });
}

// Handle persistent connections from Google pages
chrome.runtime.onConnect.addListener((port) => {
    console.log("Connection established with", port.name);
    
    if (port.name === "google-search-page") {
        port.onMessage.addListener((message) => {
            console.log("Message from Google page:", message);
            
            // Handle messages here
            if (message.message === "onPage") {
                // Extract search query from Google URL
                let searchQuery = "";
                try {
                    const url = new URL(message.url);
                    searchQuery = url.searchParams.get('q') || "";
                    console.log("Google search detected for:", searchQuery);
                } catch (error) {
                    console.error("Error parsing Google URL:", error);
                }
                
                // If recording is active, add this as a navigation action
                if (recState) {
                    console.log("Recording Google navigation to:", message.url);
                    pushAction({
                        browserAction: gotourl_browseraction,
                        url: message.url,
                        searchQuery: searchQuery, // Add the search query as additional metadata
                        title: message.title
                    });
                }
            } else if (message.message === "onClick") {
                // Handle Google click events
                console.log(`Click detected on Google search at: ${message.xPath}`);
                
                if (recState) {
                    pushAction({
                        browserAction: click_browseraction,
                        xpath: [message.xPath], // Wrap in array to match expected format
                        url: message.url
                    });
                }
            }
            
            // Send response with current recording state
            port.postMessage({
                response: "Received", 
                recState: recState,
                timestamp: Date.now()
            });
        });
    }
});