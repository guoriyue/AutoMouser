from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

def resize_window(driver, width, height):
    """Resize the browser window to specified dimensions."""
    driver.set_window_size(width, height)
    print(f"Window resized to {width}x{height}")

def go_to_url(driver, url):
    """Navigate to a URL using the web driver."""
    try:
        driver.get(url)
        print(f"Navigated to {url}")
    except Exception as e:
        print(f"Error navigating to {url}: {e}")

def input_text(driver, xpaths, content):
    """Input text into the first valid input field found by XPaths."""
    element_found = False
    for xpath in xpaths:
        try:
            element = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            element.clear()
            element.send_keys(content)
            print(f"Input text '{content}' into element with XPath: {xpath}")
            element_found = True
            break
        except TimeoutException:
            continue
    if not element_found:
        print("Failed to find an input element.")

def set_content(driver, xpaths, content):
    """Set content in the first available element from the provided XPaths."""
    element_found = False
    for xpath in xpaths:
        try:
            element = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            element.clear()
            element.send_keys(content)
            print(f"Set content '{content}' in element with XPath: {xpath}")
            element_found = True
            break
        except TimeoutException:
            continue
    if not element_found:
        print("Failed to find a settable element.")

def calculate_delay(previous, current):
    """Calculate the delay required between actions based on their timestamps."""
    return max(0, (current - previous) / 1000)

# Initialize WebDriver
driver = webdriver.Chrome()

# Define the sequence of actions
actions = [
    {"action": "WINDOW_RESIZE", "width": 1525, "height": 864, "timestamp": 1742882587174},
    {"action": "GO_TO_URL", "url": "http://google.com/", "timestamp": 1742882587174},
    {"action": "GO_TO_URL", "url": "https://google.com/", "timestamp": 1742882587175},
    {"action": "GO_TO_URL", "url": "https://www.google.com/", "timestamp": 1742882587175},
    {"action": "INPUT", "xpaths": ["//textarea[@id='APjFqb']", "/html/body/div[@class='L3eUgb']/div[@class='o3j99 ikrT4e om7nvf']/form/div/div[@class='A8SBwf sbfc']/div[@class='RNNXgb']/div[@class='SDkEP']/div[@class='a4bIc']/textarea[@id='APjFqb' and @name='q' and @class='gLFyf' and @type='textarea']", "//*[@id=\"APjFqb\"]"], "content": "hello world", "timestamp": 1742882590514},
    {"action": "SET", "xpaths": ["//textarea[@id='APjFqb']", "/html/body/div[@class='L3eUgb']/div[@class='o3j99 ikrT4e om7nvf']/form/div/div[@class='A8SBwf emcav']/div[@class='RNNXgb']/div[@class='SDkEP']/div[@class='a4bIc']/textarea[@id='APjFqb' and @name='q' and @class='gLFyf' and @type='textarea']", "//*[@id=\"APjFqb\"]"], "content": "hello world", "timestamp": 1742882590559},
    {"action": "GO_TO_URL", "url": "https://www.google.com/search?q=hello+world&sca_esv=d81613467fe5f619&sxsrf=AHTn8zrCVzFe2UluHD_24oPNFltlBIyToA%3A1742882587095&source=hp&ei=G0fiZ__YA6Ku0PEPh-qB2QU&iflsig=ACkRmUkAAAAAZ-JVK_YqicWjG92EGdEQSHzbBDoLiZ_z&ved=0ahUKEwi_0vLLx6SMAxUiFzQIHQd1IFsQ4dUDCBo&uact=5&oq=hello+world&gs_lp=Egdnd3Mtd2l6IgtoZWxsbyB3b3JsZDIKECMYgAQYJxiKBTIKECMYgAQYJxiKBTILEAAYgAQYsQMYgwEyCBAAGIAEGLEDMgsQABiABBixAxiDATIIEAAYgAQYsQMyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAESM4QUABY4A9wAHgAkAEAmAFdoAGSBqoBAjExuAEDyAEA-AEBmAILoAKoBsICChAAGIAEGEMYigXCAgoQLhiABBhDGIoFwgIOEAAYgAQYsQMYgwEYigXCAg4QLhiABBixAxiDARiKBcICDRAuGIAEGLEDGEMYigXCAgQQABgDwgIIEC4YgAQYsQPCAgUQLhiABMICERAuGIAEGLEDGNEDGIMBGMcBwgIQEAAYgAQYsQMYgwEYFBiHAsICEBAuGIAEGLEDGNEDGMcBGArCAhAQLhiABBixAxhDGIMBGIoFmAMAkgcCMTGgB5ODAbIHAjExuAeoBg&sclient=gws-wiz", "timestamp": 1742882590957}
]

# Execute actions
prev_timestamp = actions[0]['timestamp']
for action in actions:
    # Calculate delay based on timestamps
    delay = calculate_delay(prev_timestamp, action['timestamp'])
    time.sleep(delay)
    prev_timestamp = action['timestamp']

    # Perform action
    if action['action'] == "WINDOW_RESIZE":
        resize_window(driver, action['width'], action['height'])
    elif action['action'] == "GO_TO_URL":
        go_to_url(driver, action['url'])
    elif action['action'] == "INPUT":
        input_text(driver, action['xpaths'], action['content'])
    elif action['action'] == "SET":
        set_content(driver, action['xpaths'], action['content'])

# Clean up
driver.quit()
