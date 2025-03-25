// Simplified standalone Google content script - no imports needed

// Connection management
let port;
let isConnected = false;
let pendingMessages = [];
let retryCount = 0;
const MAX_RETRIES = 5;

console.log("Google-specific content script loaded");

// Connect to background script
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

// Safely post a message to the background script
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

// Generate an XPath for a Google element
function getGoogleXPath(element) {
    try {
        // Simple XPath generation for Google
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        
        // Fallback to simple class-based path
        if (element.className) {
            const classes = element.className.split(' ').join('.');
            return `//*[contains(@class, "${classes}")]`;
        }
        
        // Very basic path
        return element.tagName.toLowerCase();
    } catch (e) {
        console.log("XPath error:", e);
        return "unknown";
    }
}

// Set up event listeners for Google search pages
function setupEventListeners() {
    // Click tracking with efficient event handling
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
    
    // Periodically check connection
    setInterval(() => {
        if (!isConnected) {
            connectToBackground();
        }
    }, 5000);
}

// Initialize
connectToBackground();
setupEventListeners();

// Expose minimal API to window for debugging (optional)
window.googleContentScript = {
    isConnected: () => isConnected,
    reconnect: connectToBackground
}; 