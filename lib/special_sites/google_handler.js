// Google-specific content script handlers
// Provides specialized functionality for Google Search pages

// Connection management
let port;
let isConnected = false;
let pendingMessages = [];
let retryCount = 0;
const MAX_RETRIES = 5;

// Near the top of the file, update the import paths
import { elementExists } from '../common/elements/element_checker.js';
import { getElementValue as getElementValueBase, hoverElement as hoverElementBase } 
    from '../common/elements/element_actions.js';

/**
 * Initialize the Google handler
 * @returns {Object} - API for interacting with Google pages
 */
export function initGoogleHandler() {
    console.log("Google handler initialized");
    connectToBackground();
    setupEventListeners();
    
    // Return public API
    return {
        isElementPresent,
        getElementValue,
        hoverElement,
        reconnect: connectToBackground
    };
}

/**
 * Establish a connection to the background script
 */
function connectToBackground() {
    try {
        if (chrome && chrome.runtime) {
            port = chrome.runtime.connect({name: "google-search-page"});
            
            port.onDisconnect.addListener(() => {
                console.log("Port disconnected, will try to reconnect");
                isConnected = false;
                
                // Try to reconnect with backoff
                if (retryCount < MAX_RETRIES) {
                    const backoffTime = Math.pow(2, retryCount) * 1000;
                    retryCount++;
                    console.log(`Retry ${retryCount} in ${backoffTime}ms`);
                    setTimeout(connectToBackground, backoffTime);
                } else {
                    console.log("Max retries reached, giving up");
                }
            });
            
            port.onMessage.addListener((message) => {
                console.log("Message from background:", message);
                retryCount = 0; // Reset retry count on successful message
            });
            
            isConnected = true;
            
            // Send any queued messages
            while (pendingMessages.length > 0) {
                const msg = pendingMessages.shift();
                safePostMessage(msg);
            }
            
            // Let the background script know we're on Google
            safePostMessage({
                message: "onPage",
                url: window.location.href,
                title: document.title
            });
        }
    } catch (e) {
        console.log("Connection error:", e);
        isConnected = false;
    }
}

/**
 * Safely post a message to the background script
 * @param {Object} message - Message to send
 * @returns {boolean} - Success status
 */
function safePostMessage(message) {
    try {
        if (isConnected && port) {
            port.postMessage(message);
            return true;
        } else {
            pendingMessages.push(message);
            return false;
        }
    } catch (e) {
        console.log("Post message error:", e);
        pendingMessages.push(message);
        isConnected = false;
        // Try to reconnect
        connectToBackground();
        return false;
    }
}

/**
 * Generate an XPath for a Google element
 * @param {Element} element - DOM element
 * @returns {string} - XPath
 */
function getGoogleXPath(element) {
    try {
        // Simple XPath generation for Google
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        
        // Google search results often have data-ved attributes
        if (element.getAttribute('data-ved')) {
            return `//*[@data-ved="${element.getAttribute('data-ved')}"]`;
        }
        
        // Fallback to simple class-based path
        if (element.className) {
            const classes = element.className.split(' ').join('.');
            return `//*[contains(@class, "${classes}")]`;
        }
        
        // Very basic path as last resort
        return element.tagName.toLowerCase();
    } catch (e) {
        console.log("XPath error:", e);
        return "unknown";
    }
}

/**
 * Set up event listeners for Google page interactions
 */
function setupEventListeners() {
    // Click listener
    document.addEventListener("click", (event) => {
        try {
            const element = event.target || event.srcElement;
            const xpath = getGoogleXPath(element);
            
            safePostMessage({
                message: "onClick",
                xPath: xpath,
                url: window.location.href
            });
        } catch (e) {
            console.log("Click handler error:", e);
        }
    }, true);
    
    // Hover listener (for future enhancement)
    document.addEventListener("mouseover", (event) => {
        // Debounce to avoid too many events
        if (!window._hoverDebounce) {
            window._hoverDebounce = setTimeout(() => {
                try {
                    const element = event.target || event.srcElement;
                    // Only capture hovers on meaningful elements
                    if (element.tagName === 'A' || element.tagName === 'BUTTON' || 
                        element.tagName === 'INPUT' || element.tagName === 'DIV' && element.onclick) {
                        
                        const xpath = getGoogleXPath(element);
                        safePostMessage({
                            message: "onHover",
                            xPath: xpath
                        });
                    }
                    window._hoverDebounce = null;
                } catch (e) {
                    console.log("Hover handler error:", e);
                    window._hoverDebounce = null;
                }
            }, 300);
        }
    });
    
    // Periodically check connection
    setInterval(() => {
        if (!isConnected) {
            connectToBackground();
        }
    }, 5000);
}

/**
 * Check if an element exists (Future enhancement)
 * @param {string} selector - CSS selector or XPath
 * @returns {boolean} - Whether element exists
 */
function isElementPresent(selector, isXPath = false) {
    try {
        if (isXPath) {
            const result = document.evaluate(
                selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
            );
            return !!result.singleNodeValue;
        } else {
            return !!document.querySelector(selector);
        }
    } catch (e) {
        console.log("Element check error:", e);
        return false;
    }
}

/**
 * Get value of an element (Future enhancement)
 * @param {string} selector - CSS selector or XPath
 * @returns {string|null} - Element's value or text content
 */
function getElementValue(selector, isXPath = false) {
    try {
        let element;
        if (isXPath) {
            const result = document.evaluate(
                selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
            );
            element = result.singleNodeValue;
        } else {
            element = document.querySelector(selector);
        }
        
        if (!element) return null;
        
        // Return the most meaningful value
        return element.value || element.textContent || element.innerText || null;
    } catch (e) {
        console.log("Get value error:", e);
        return null;
    }
}

/**
 * Simulate hover on element (Future enhancement)
 * @param {string} selector - CSS selector or XPath
 */
function hoverElement(selector, isXPath = false) {
    try {
        let element;
        if (isXPath) {
            const result = document.evaluate(
                selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
            );
            element = result.singleNodeValue;
        } else {
            element = document.querySelector(selector);
        }
        
        if (!element) return false;
        
        // Simulate hover events
        element.dispatchEvent(new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
        
        safePostMessage({
            message: "simulatedHover",
            xPath: getGoogleXPath(element)
        });
        
        return true;
    } catch (e) {
        console.log("Hover simulation error:", e);
        return false;
    }
} 