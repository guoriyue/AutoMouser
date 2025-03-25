// Export any constants, functions, or objects needed by other modules
export const PROMPTS = {
  // Your prompt templates
};

export function generatePrompt(data) {
  // Your function code
}

export const SELENIUM_PROMPT = `Task Description: You are an advanced AI specialized in generating high-quality, robust Selenium automation scripts. Your task is to generate a Python Selenium script that mimics a series of user interactions based on the provided list of browser actions, XPaths, and input data.

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