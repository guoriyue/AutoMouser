document.oncontextmenu = function(a) {
    a = a || window.event;
    var b = a.target || a.srcElement;
    var c = getXpaths(b);
    chrome.runtime.sendMessage({
        message: "onContextMenuClick",
        xPath: c,
        content: b.textContent
    });
    return true;
};

function getXpaths(a) {
    var b = [];
    b.push(getElementInfo_Custom(a, false));
    b.push(getElementInfo_Custom(a, true));
    b.push(getElementInfo_Moz(a));
    var c = function(a) {
        var b = {};
        return a.filter(function(a) {
            if (b[a]) {
                return;
            }
            b[a] = true;
            return a;
        });
    };
    var d = c(b);
    d.forEach(function(a, b) {
        var c = document.evaluate(a, document, null, XPathResult.ANY_TYPE, null);
        var e = c.iterateNext();
        var f = 0;
        while (e) {
            e = c.iterateNext();
            f++;
        }
        console.log("number of elements for xpath [" + a + "]: " + f);
        if (f > 1) {
            console.log("remove xpath for a non unique result [" + a + "]");
            d.splice(b, 1);
        }
    });
    return d;
}

// Check if we're in an extension context before using Chrome APIs
if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Make sure message listeners are defined before sending messages
    document.addEventListener('DOMContentLoaded', function() {
        // Now it's safe to use Chrome APIs
        chrome.runtime.sendMessage({
            message: "recState"
        }, function(response) {
            // Handle the response safely
            if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError);
                return;
            }
            
            // Use response data if available
            if (response) {
                console.log('RecState response:', response);
            }
        });
    });
} else {
    console.warn('Chrome extension API not available in this context');
}

// Add error handling wrapper for all chrome API calls
function safeSendMessage(message, callback) {
    try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(message, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Chrome runtime error:', chrome.runtime.lastError.message);
                    return;
                }
                if (callback && typeof callback === 'function') {
                    callback(response);
                }
            });
        } else {
            console.log('Chrome runtime API not available');
        }
    } catch (error) {
        console.log('Error sending message:', error);
        // Attempt to reconnect or handle the error gracefully
    }
}

// Use debounce to reduce frequent API calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Wrap all event listeners with try-catch and use the safe send function
document.addEventListener("click", function(a) {
    try {
        safeSendMessage({
            message: "recState"
        }, function(b) {
            if (b && b.recState) {
                a = a || window.event;
                var c = a.target || a.srcElement;
                var d = getXpaths(c);
                console.log("click on xpath: " + d);
                safeSendMessage({
                    message: "onClick",
                    xPath: d
                });
            }
        });
    } catch (error) {
        console.log('Error in click handler:', error);
    }
});

document.addEventListener("dblclick", function(a) {
    chrome.runtime.sendMessage({
        message: "recState"
    }, function(b) {
        if (b.recState) {
            a = a || window.event;
            var c = a.target || a.srcElement;
            var d = getXpaths(c);
            console.log("dblclick on xpath: " + d);
            chrome.runtime.sendMessage({
                message: "onDblClick",
                xPath: d
            });
        }
    });
});

document.addEventListener("change", function(a) {
    chrome.runtime.sendMessage({
        message: "recState"
    }, function(b) {
        if (b.recState) {
            a = a || window.event;
            var c = a.target || a.srcElement;
            var d = getXpaths(c);
            console.log("set value on xpath: " + d + " | content: " + c.value);
            chrome.runtime.sendMessage({
                message: "onChange",
                xPath: d,
                content: a.target.value
            });
        }
    });
});

document.addEventListener("scroll", function(a) {
    chrome.runtime.sendMessage({
        message: "recState"
    }, function(b) {
        if (b.recState) {
            a = a || window.event;
            var c = a.target.scrollingElement || a.srcElement.scrollingElement;
            var d = getXpaths(c);
            console.log("scroll on element xpath [" + d + "], top [" + a.target.scrollingElement.scrollTop + "] left[" + a.target.scrollingElement.scrollLeft + "]");
            chrome.runtime.sendMessage({
                message: "onScroll",
                xPath: d,
                top: a.target.scrollingElement.scrollTop,
                left: a.target.scrollingElement.scrollLeft
            });
        }
    });
});

// // Add keyboard input tracking
// document.addEventListener("keydown", async function(event) {
//     chrome.runtime.sendMessage({
//         message: "recState"
//     }, function(b) {
//         if (b.recState) {
//             // Only track specific keys like Enter, Tab, Escape, etc.
//             const specialKeys = ["Enter", "Tab", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
//             if (specialKeys.includes(event.key)) {
//                 const target = event.target || event.srcElement;
//                 const xpaths = getXpaths(target);
//                 console.log(`Keypress ${event.key} on xpath: ${xpaths}`);
//                 chrome.runtime.sendMessage({
//                     message: "onKeyPress",
//                     xPath: xpaths,
//                     key: event.key
//                 });
//             } else {
//                 console.log(`Keypress ${event.key} on xpath: ${xpaths}`);
//             }
//         }
//     });
// });

// Add input event listener with immediate capture
document.addEventListener("input", debounce(function(event) {
    try {
        safeSendMessage({
            message: "recState"
        }, function(response) {
            if (response && response.recState) {
                var target = event.target || event.srcElement;
                var xpaths = getXpaths(target);
                console.log("input on xpath: " + xpaths + " | content: " + target.value);
                safeSendMessage({
                    message: "onInput",
                    xPath: xpaths,
                    content: target.value
                });
            }
        });
    } catch (error) {
        console.log('Error in input handler:', error);
    }
}, 100)); // Debounce by 100ms

// Add keyup event listener as backup for single character inputs
document.addEventListener("keyup", function(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
        chrome.runtime.sendMessage({
            message: "recState"
        }, function(b) {
            if (b.recState) {
                const target = event.target;
                const xpaths = getXpaths(target);
                var inputValue = target.value || target.textContent || '';
                
                console.log(`Input value (keyup event) on xpath: ${xpaths} | content: ${inputValue}`);
                chrome.runtime.sendMessage({
                    message: "onInput",
                    xPath: xpaths,
                    content: inputValue
                });
            }
        });
    }
});

var getElementInfo_Custom = function a(b, c) {
    var d = function(a, b) {
        var c = {
            num: 0,
            index: 1
        };
        var d = 0;
        var e = 0;
        var f = a.previousSibling;
        var g = a.nextSibling;
        if (b) {
            while (f !== null) {
                if (f.id === a.id && f.tagName === a.tagName && f.name === a.name && f.className === a.className && f.type === a.type) {
                    d += 1;
                }
                f = f.previousSibling;
            }
            while (g !== null) {
                if (g.id === a.id && g.tagName === a.tagName && g.name === a.name && g.className === a.className && g.type === a.type) {
                    e += 1;
                }
                g = g.nextSibling;
            }
        } else {
            while (f !== null) {
                if (f.tagName === a.tagName) {
                    d += 1;
                }
                f = f.previousSibling;
            }
            while (g !== null) {
                if (g.tagName === a.tagName) {
                    e += 1;
                }
                g = g.nextSibling;
            }
        }
        c["num"] = d + e;
        c["index"] += d;
        return c;
    };
    var e = function(a, b) {
        var c = a.tagName.toLowerCase();
        var e = d(a, b);
        if (b) {
            var f = [];
            var g = [ "@type=", "@class=", "@name=", "@id=" ];
            var h = [ a.type, a.className, a.name, a.id ];
            for (var i = g.length - 1; i >= 0; i--) {
                if (typeof h[i] !== "undefined" && h[i] !== "") {
                    f.push(g[i] + "'" + h[i] + "'");
                }
            }
            if (f.length > 0) {
                c += "[" + f.join(" and ") + "]";
            }
        }
        if (e["num"] > 0) {
            c += "[" + e["index"] + "]";
        }
        return c;
    };
    var f = function(a) {
        return h("//" + a.tagName.toLowerCase() + "[@id='" + a.id + "']");
    };
    var g = function(a, b) {
        var c = e(a, b);
        var d = a.parentNode;
        while (d.tagName) {
            if (!b) {
                if (a.id !== "") {
                    return f(a);
                }
                if (d.id !== "") {
                    return f(d) + "/" + c;
                }
            }
            c = e(d, b) + "/" + c;
            d = d.parentNode;
        }
        return h(c);
    };
    var h = function(a) {
        return a.replace(/^((\/){0,2}html)/, "/html");
    };
    return g(b, c);
};

var Xpath = {};

var getElementInfo_Moz = Xpath.getElementXPath = function(a) {
    if (a && a.id) {
        return '//*[@id="' + a.id + '"]';
    } else {
        return Xpath.getElementTreeXPath_Moz(a);
    }
};

Xpath.getElementTreeXPath_Moz = function(a) {
    var b = [];
    for (;a && a.nodeType === Node.ELEMENT_NODE; a = a.parentNode) {
        var c = 0;
        var d = false;
        for (var e = a.previousSibling; e; e = e.previousSibling) {
            if (e.nodeType === Node.DOCUMENT_TYPE_NODE) {
                continue;
            }
            if (e.nodeName === a.nodeName) {
                ++c;
            }
        }
        for (var e = a.nextSibling; e && !d; e = e.nextSibling) {
            if (e.nodeName === a.nodeName) {
                d = true;
            }
        }
        var f = (a.prefix ? a.prefix + ":" : "") + a.localName;
        var g = c || d ? "[" + (c + 1) + "]" : "";
        b.splice(0, 0, f + g);
    }
    return b.length ? "/" + b.join("/") : null;
};