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
- Use Selenium's Python bindings.
- Ensure clear structure and modularity, with methods for each action type (click, input, resize, etc.).
- Handle exceptions gracefully using try/except blocks.
- Include comments describing each step.
- Follow best practices for stability and maintainability, such as waits for elements and validations.

Input Format:
You will receive a JSON-like structure with browser actions:

[
  {
    "browserAction": "WINDOW_RESIZE",
    "width": 1305,
    "height": 864,
    "timestamp": 1735343671880
  },
  {
    "browserAction": "GO_TO_URL",
    "url": "https://x.com/",
    "timestamp": 1735343671880
  },
  {
    "browserAction": "SCROLL",
    "xpath": [
      "XPATH-#1"
    ],
    "top": 11,
    "left": 0,
    "timestamp": 1735343674558
  },
  {
    "browserAction": "CLICK",
    "xpath": [
      "XPATH-#2",
      "XPATH-#3",
      "XPATH-#4"
    ],
    "timestamp": 1735343676000
  },
  {
    "browserAction": "INPUT",
    "xpath": [
      "XPATH-#5",
      "XPATH-#6",
      "XPATH-#7"
    ],
    "content": "AutoMouser",
    "timestamp": 1735343677147
  },
  {
    "browserAction": "SET",
    "xpath": [
      "XPATH-#8",
      "XPATH-#9",
      "XPATH-#10"
    ],
    "content": "AutoMouser",
    "timestamp": 1735343677148
  }
]


Key Guidelines:
- For WINDOW_RESIZE, configure the browser window size using the given dimensions.
- For CLICK, attempt to locate each XPath in sequence and click the first visible and interactable element.
- For INPUT, type the provided content into the first valid field located using the given XPaths.
- Introduce time-based delays using time.sleep() for the timestamp differences, simulating realistic user behavior.
- Validate each action's success with assertion statements where applicable.

Output Expectations: The output should be a complete Python script with the following structure:
\`\`\`python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time

def resize_window(driver, width, height):
    # Resize the browser window
    driver.set_window_size(width, height)
    print(f"Window resized to {width}x{height}")

def go_to_url(driver, url):
    # Navigates to the specified URL
    try:
        driver.get(url)
        print(f"Navigated to {url}")
    except Exception as e:
        print(f"Error navigating to {url}: {e}")

def scroll_to_element(driver, xpath, top, left):
    # Scroll to the specific element on the page
    try:
        element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, xpath)))
        driver.execute_script("arguments[0].scrollIntoView();", element)
        driver.execute_script(f"window.scrollTo({left}, {top});")
        print(f"Scrolled to {xpath}")
    except Exception as e:
        print(f"Scroll error: {e}")

def click_element(driver, xpaths):
    # Clicks the first found interactable element using one of the provided XPaths
    try:
        for xpath in xpaths:
            elements = driver.find_elements(By.XPATH, xpath)
            for element in elements:
                if element.is_displayed() and element.is_enabled():
                    element.click()
                    print(f"Clicked element with xpath: {xpath}")
                    return
        raise Exception("No clickable elements found.")
    except Exception as e:
        print(f"Error during CLICK action: {e}")

def input_text(driver, xpaths, text):
    # Inputs text into the first found interactable field
    try:
        for xpath in xpaths:
            input_fields = driver.find_elements(By.XPATH, xpath)
            for field in input_fields:
                if field.is_displayed() and field.is_enabled():
                    field.clear()
                    field.send_keys(text)
                    print(f"Input '{text}' into field with xpath: {xpath}")
                    return
        raise Exception("No interactable input fields found.")
    except Exception as e:
        print(f"Error during INPUT action: {e}")

def set_content(driver, xpaths, content):
    """Set the content in the first available element from a list of XPaths."""
    for xpath in xpaths:
        try:
            field = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            if field.is_displayed() and field.is_enabled():
                field.clear()  # Clear any existing content
                field.send_keys(content)
                print(f"Input '{content}' into field at {xpath}.")
                break
        except Exception as e:
            print(f"Error setting content on {xpath}: {e}")

def execute_actions(driver):
    actions = [
        {"type": "WINDOW_RESIZE", "width": 1305, "height": 864, "timestamp": 1735343671880},
        {"type": "GO_TO_URL", "url": "https://x.com/", "timestamp": 1735343671880},
        {"type": "SCROLL", "xpath": "/html", "top": 11, "left": 0, "timestamp": 1735343674558},
        {"type": "CLICK", "xpath": ["//div[@id='react-root']/div/div/div[2]/main/div/div/div[1]/div[1]/div/div[3]/div[4]/a/div/span/span", "/html/body/div[@id='react-root']/div[@class='css-175oi2r r-13awgt0 r-12vffkv']/div[@class='css-175oi2r r-13awgt0 r-12vffkv']/div[@class='css-175oi2r r-1f2l425 r-13qz1uu r-417010']/main[@class='css-175oi2r r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-150rngu r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-13awgt0']/div[@class='css-175oi2r r-tv6buo r-791edh r-1euycsn']/div[@class='css-175oi2r r-1777fci r-nsbfu8 r-1qmwkkh']/div[@class='css-175oi2r r-1pcd2l5 r-13qz1uu r-jjmaes r-1nz9sz9']/div[@class='css-175oi2r']/div[@class='css-175oi2r r-2o02ov']/a[@class='css-175oi2r r-sdzlij r-1phboty r-rs99b7 r-lrvibr r-17w48nw r-a9p05 r-eu3ka r-5oul0u r-1ipicw7 r-2yi16 r-1qi8awa r-3pj75a r-o7ynqc r-6416eg r-1ny4l3l r-1loqt21']/div[@class='css-146c3p1 r-bcqeeo r-qvutc0 r-37j5jr r-q4m81j r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-18u37iz r-16y2uox r-1777fci']/span[@class='css-1jxf684 r-dnmrzs r-1udh08x r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-a023e6 r-rjixqe']/span[@class='css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3']", "/html/body/div/div/div/div[2]/main/div/div/div[1]/div[1]/div/div[3]/div[4]/a/div/span/span"], "timestamp": 1735343676000},
        {"type": "INPUT", "xpath": ["//div[@id='layers']/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[4]/label/div/div[2]/div/input", "/html/body/div[@id='react-root']/div[@class='css-175oi2r r-13awgt0 r-12vffkv']/div[@class='css-175oi2r r-13awgt0 r-12vffkv']/div[@id='layers' and @class='r-zchlnj r-1d2f490 r-u8s1d r-ipm5af']/div[@class='css-175oi2r r-aqfbo4 r-zchlnj r-1d2f490 r-1xcajam r-12vffkv']/div[@class='css-175oi2r r-12vffkv']/div[@class='css-175oi2r r-12vffkv']/div[@class='css-175oi2r r-1p0dtai r-1adg3ll r-1d2f490 r-bnwqim r-zchlnj r-ipm5af']/div[@class='r-1oszu61 r-1niwhzg r-vqxq0j r-deolkf r-1mlwlqe r-eqz5dr r-1ebb2ja r-crgep1 r-ifefl9 r-bcqeeo r-t60dpp r-13wfysu r-417010 r-1p0dtai r-1adg3ll r-1d2f490 r-bnwqim r-zchlnj r-ipm5af']/div[@class='css-175oi2r r-1pz39u2 r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-1ny4l3l r-18u37iz r-1pi2tsx r-1777fci r-1xcajam r-ipm5af r-g6jmlv r-1awozwy']/div[@class='css-175oi2r r-1wbh5a2 r-htvplk r-1udh08x r-1867qdf r-kwpbio r-rsyp9y r-1pjcn9w r-1279nm1']/div[@class='css-175oi2r r-kemksi r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-1pz39u2 r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-1ny4l3l r-6koalj r-16y2uox r-kemksi r-1wbh5a2']/div[@class='css-175oi2r r-16y2uox r-1wbh5a2 r-f8sm7e r-13qz1uu r-1ye8kvj']/div[@class='css-175oi2r r-16y2uox r-1wbh5a2 r-1dqxon3']/div[@class='css-175oi2r']/div[@class='css-175oi2r r-ywje51 r-nllxps r-jxj0sb r-1fkl15p r-16wqof']/div[@class='css-175oi2r r-1mmae3n r-1e084wi r-13qz1uu']/label[@class='css-175oi2r r-z2wwpe r-rs99b7 r-18u37iz r-vhj8yc r-9cip40']/div[@class='css-175oi2r r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-18u37iz r-16y2uox r-1wbh5a2 r-1wzrnnt r-1udh08x r-xd6kpl r-is05cd r-ttdzmv']/div[@class='css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-135wba7 r-16dba41 r-1awozwy r-6koalj r-1inkyih r-13qz1uu']/input[@name='text' and @class='r-30o5oe r-1dz5y72 r-13qz1uu r-1niwhzg r-17gur6a r-1yadl64 r-deolkf r-homxoj r-poiln3 r-7cikom r-1ny4l3l r-t60dpp r-fdjqy7' and @type='text']", "/html/body/div/div/div/div[1]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[4]/label/div/div[2]/div/input"], "content": "AutoMousera908", "timestamp": 1735343677147},
        {"type": "SET", "xpath": ["//div[@id='layers']/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[4]/label/div/div[2]/div/input", "/html/body/div[@id='react-root']/div[@class='css-175oi2r r-13awgt0 r-12vffkv']/div[@class='css-175oi2r r-13awgt0 r-12vffkv']/div[@id='layers' and @class='r-zchlnj r-1d2f490 r-u8s1d r-ipm5af']/div[@class='css-175oi2r r-aqfbo4 r-zchlnj r-1d2f490 r-1xcajam r-12vffkv']/div[@class='css-175oi2r r-12vffkv']/div[@class='css-175oi2r r-12vffkv']/div[@class='css-175oi2r r-1p0dtai r-1adg3ll r-1d2f490 r-bnwqim r-zchlnj r-ipm5af']/div[@class='r-1oszu61 r-1niwhzg r-vqxq0j r-deolkf r-1mlwlqe r-eqz5dr r-1ebb2ja r-crgep1 r-ifefl9 r-bcqeeo r-t60dpp r-13wfysu r-417010 r-1p0dtai r-1adg3ll r-1d2f490 r-bnwqim r-zchlnj r-ipm5af']/div[@class='css-175oi2r r-1pz39u2 r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-1ny4l3l r-18u37iz r-1pi2tsx r-1777fci r-1xcajam r-ipm5af r-g6jmlv r-1awozwy']/div[@class='css-175oi2r r-1wbh5a2 r-htvplk r-1udh08x r-1867qdf r-kwpbio r-rsyp9y r-1pjcn9w r-1279nm1']/div[@class='css-175oi2r r-kemksi r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-1pz39u2 r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-1ny4l3l r-6koalj r-16y2uox r-kemksi r-1wbh5a2']/div[@class='css-175oi2r r-16y2uox r-1wbh5a2 r-f8sm7e r-13qz1uu r-1ye8kvj']/div[@class='css-175oi2r r-16y2uox r-1wbh5a2 r-1dqxon3']/div[@class='css-175oi2r']/div[@class='css-175oi2r r-ywje51 r-nllxps r-jxj0sb r-1fkl15p r-16wqof']/div[@class='css-175oi2r r-1mmae3n r-1e084wi r-13qz1uu']/label[@class='css-175oi2r r-z2wwpe r-rs99b7 r-18u37iz r-vhj8yc r-9cip40']/div[@class='css-175oi2r r-16y2uox r-1wbh5a2']/div[@class='css-175oi2r r-18u37iz r-16y2uox r-1wbh5a2 r-1wzrnnt r-1udh08x r-xd6kpl r-is05cd r-ttdzmv']/div[@class='css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-135wba7 r-16dba41 r-1awozwy r-6koalj r-1inkyih r-13qz1uu']/input[@name='text' and @class='r-30o5oe r-1dz5y72 r-13qz1uu r-1niwhzg r-17gur6a r-1yadl64 r-deolkf r-homxoj r-poiln3 r-7cikom r-1ny4l3l r-t60dpp r-fdjqy7' and @type='text']", "/html/body/div/div/div/div[1]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[4]/label/div/div[2]/div/input"], "content": "AutoMousera908", "timestamp": 1735343677148},
    ]
    # Execute actions based on type and properties
    time.sleep(1)
    for action in actions:
        if action['type'] == "WINDOW_RESIZE":
            resize_window(driver, action['width'], action['height'])
        elif action['type'] == "GO_TO_URL":
            go_to_url(driver, action['url'])
        elif action['type'] == "SCROLL":
            scroll_to_element(driver, action['xpath'], action['top'], action['left'])
        elif action['type'] == "CLICK":
            click_element(driver, action['xpath'])
        elif action['type'] in {"INPUT"}:
            input_text(driver, action['xpath'], action['content'])
        elif action['type'] in {"SET"}:
            set_content(driver, action['xpath'], action['content'])
        time.sleep(1)

if __name__ == "__main__":
    driver = webdriver.Chrome()  # Ensure the appropriate ChromeDriver is installed
    execute_actions(driver)
    driver.quit()
\`\`\`

Convert the following browser tracking log to a Python Selenium script:
`;

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