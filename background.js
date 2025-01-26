let LLM_CONFIG = null;

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

chrome.history.onVisited.addListener(function(a) {
    if (window.recState) {
        chrome.history.getVisits({
            url: a.url
        }, function(b) {
            var c = b[b.length - 1];
            if (c.transition === "typed") {
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
        pushAction({
            browserAction: window.click_browseraction,
            xpath: window.xpathOfSelectedElement
        });
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
                    timestamp: Date.now()
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
                content: SELENIUM_PROMPT
            },
            {
                role: "user",
                content: JSON.stringify(simplifiedLog, null, 2)
            }
        ]
    };
    
    import('./popup_manager.js').then(module => {
        module.generateCodeWithPopup(jsonBlob, requestBody, xpathMap, LLM_CONFIG);
    });
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
        window.actions = [];
        chrome.browserAction.setBadgeText({
            text: "rec"
        });
        console.log("Start recording...");
        window.recState = !window.recState;
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