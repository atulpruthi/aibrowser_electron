// Function Registry - All available browser control functions
// Each function has: name, description, parameters, permissions, handler

const functionRegistry = {
  // ========== NAVIGATION FUNCTIONS ==========
  navigate: {
    description: "Navigate to a specific URL",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to navigate to"
        }
      },
      required: ["url"]
    },
    permission: "auto",
    offline: true,
    handler: async (params, context) => {
      const { createTab } = context;
      if (!createTab) throw new Error("createTab function not available");
      
      let url = params.url;
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      createTab(url);
      return { success: true, url: url };
    }
  },

  search: {
    description: "Search the web using a search engine",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        },
        engine: {
          type: "string",
          enum: ["google", "bing", "duckduckgo"],
          description: "Search engine to use (default: google)"
        }
      },
      required: ["query"]
    },
    permission: "auto",
    offline: false,
    handler: async (params, context) => {
      const { createTab } = context;
      if (!createTab) throw new Error("createTab function not available");
      
      const engine = params.engine || "google";
      const query = encodeURIComponent(params.query);
      
      const searchUrls = {
        google: `https://www.google.com/search?q=${query}`,
        bing: `https://www.bing.com/search?q=${query}`,
        duckduckgo: `https://duckduckgo.com/?q=${query}`
      };
      
      createTab(searchUrls[engine]);
      return { success: true, query: params.query, engine: engine };
    }
  },

  openTab: {
    description: "Open a new browser tab",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL to open (default: about:blank)"
        }
      }
    },
    permission: "auto",
    offline: true,
    handler: async (params, context) => {
      const { createTab } = context;
      if (!createTab) throw new Error("createTab function not available");
      
      const url = params.url || 'about:blank';
      createTab(url);
      return { success: true, url: url };
    }
  },

  closeTab: {
    description: "Close the current or specified tab",
    parameters: {
      type: "object",
      properties: {
        tabId: {
          type: "number",
          description: "Tab ID to close (omit for current tab)"
        }
      }
    },
    permission: "prompt",
    offline: true,
    handler: async (params, context) => {
      const { closeTab, activeTabId } = context;
      if (!closeTab) throw new Error("closeTab function not available");
      
      const tabId = params.tabId || activeTabId;
      closeTab(tabId);
      return { success: true, tabId: tabId };
    }
  },

  click: {
    description: "Click an element on the page",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector or text content to find and click"
        },
        text: {
          type: "string",
          description: "Text content of element to click"
        }
      }
    },
    permission: "auto",
    offline: false,
    handler: async (params, context) => {
      const { webview, waitForWebviewReady } = context;
      if (!webview) throw new Error("No active tab");
      await waitForWebviewReady(webview);
      
      const searchText = params.text || params.selector || '';
      
      const result = await webview.executeJavaScript(`
        (function() {
          const text = '${searchText.replace(/'/g, "\\'")}';
          
          // Try direct selector first
          let el = document.querySelector(text);
          
          // If not found, search by text content in clickable elements
          if (!el) {
            // Expanded selector for complex sites like Gmail
            const selectors = [
              'button', 'a', '[role="button"]', '[role="link"]', 
              'input[type="button"]', 'input[type="submit"]',
              '[onclick]', '[tabindex]',
              'div[role="button"]', 'span[role="button"]',
              'div[class*="button"]', 'span[class*="button"]'
            ];
            
            const elements = Array.from(document.querySelectorAll(selectors.join(', ')));
            
            // Try exact match first (case-insensitive)
            el = elements.find(e => {
              const content = (e.textContent || e.value || e.ariaLabel || '').trim().toLowerCase();
              return content === text.toLowerCase();
            });
            
            // Try partial match if exact match not found
            if (!el) {
              el = elements.find(e => {
                const content = (e.textContent || e.value || e.ariaLabel || '').trim().toLowerCase();
                return content.includes(text.toLowerCase());
              });
            }
          }
          
          if (el) {
            // Scroll element into view if needed
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Dispatch proper mouse events for complex sites like Gmail
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const mouseEventOptions = {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: centerX,
              clientY: centerY
            };
            
            // Simulate full mouse interaction including hover
            el.dispatchEvent(new MouseEvent('mouseover', mouseEventOptions));
            el.dispatchEvent(new MouseEvent('mouseenter', mouseEventOptions));
            el.dispatchEvent(new MouseEvent('mousemove', mouseEventOptions));
            
            // Click to potentially open dropdown
            el.dispatchEvent(new MouseEvent('mousedown', mouseEventOptions));
            el.dispatchEvent(new MouseEvent('mouseup', mouseEventOptions));
            el.dispatchEvent(new MouseEvent('click', mouseEventOptions));
            
            // Focus the element
            if (el.focus) el.focus();
            
            // Wait for potential dropdown to appear, then search for nested options
            setTimeout(() => {
              // Search for dropdown items that might have appeared
              const dropdownSelectors = [
                '[role="menuitem"]', '[role="option"]', 
                '.menu-item', '.dropdown-item',
                'li[role="option"]', 'div[role="option"]'
              ];
              
              const dropdownItems = Array.from(document.querySelectorAll(dropdownSelectors.join(', ')));
              
              // Look for matching text in dropdown items
              const dropdownMatch = dropdownItems.find(item => {
                const content = (item.textContent || item.ariaLabel || '').trim().toLowerCase();
                return content.includes(text.toLowerCase());
              });
              
              if (dropdownMatch && dropdownMatch !== el) {
                // Found a dropdown item matching the text
                dropdownMatch.focus();
                
                const dropdownRect = dropdownMatch.getBoundingClientRect();
                const dropdownOptions = {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: dropdownRect.left + dropdownRect.width / 2,
                  clientY: dropdownRect.top + dropdownRect.height / 2
                };
                
                dropdownMatch.dispatchEvent(new MouseEvent('mouseenter', dropdownOptions));
                dropdownMatch.dispatchEvent(new MouseEvent('mouseover', dropdownOptions));
                dropdownMatch.dispatchEvent(new MouseEvent('mousedown', dropdownOptions));
                dropdownMatch.dispatchEvent(new MouseEvent('mouseup', dropdownOptions));
                dropdownMatch.dispatchEvent(new MouseEvent('click', dropdownOptions));
                
                // Also try Enter key on focused element
                dropdownMatch.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
                dropdownMatch.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
              }
            }, 200);
            
            return { 
              success: true, 
              element: el.tagName, 
              text: (el.textContent || el.value || el.ariaLabel || '').trim().substring(0, 50),
              role: el.getAttribute('role')
            };
          }
          
          return { 
            success: false, 
            error: 'Element not found: ' + text + '. Searched ' + elements.length + ' clickable elements.'
          };
        })()
      `);
      
      return result;
    }
  },

  type: {
    description: "Type text into an input field",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to type"
        },
        selector: {
          type: "string",
          description: "CSS selector for input field (optional)"
        }
      }
    },
    permission: "auto",
    offline: false,
    handler: async (params, context) => {
      const { webview, waitForWebviewReady } = context;
      if (!webview) throw new Error("No active tab");
      await waitForWebviewReady(webview);
      
      const text = params.text || '';
      const selector = params.selector || 'input:focus, textarea:focus, input, textarea';
      
      const result = await webview.executeJavaScript(`
        (function() {
          const text = '${text.replace(/'/g, "\\'")}';
          const selector = '${selector}';
          
          let el = document.querySelector(selector);
          if (!el) {
            el = document.activeElement;
          }
          
          if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
            if (el.isContentEditable) {
              el.textContent = text;
            } else {
              el.value = text;
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, element: el.tagName };
          }
          return { success: false, error: 'No input field found or focused' };
        })()
      `);
      
      return result;
    }
  },

  goBack: {
    description: "Go back in browser history",
    parameters: {
      type: "object",
      properties: {}
    },
    permission: "auto",
    offline: true,
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      
      if (webview.canGoBack()) {
        webview.goBack();
        return { success: true };
      }
      return { success: false, message: "Cannot go back" };
    }
  },

  goForward: {
    description: "Go forward in browser history",
    parameters: {
      type: "object",
      properties: {}
    },
    permission: "auto",
    offline: true,
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      
      if (webview.canGoForward()) {
        webview.goForward();
        return { success: true };
      }
      return { success: false, message: "Cannot go forward" };
    }
  },

  reload: {
    description: "Reload the current page",
    parameters: {
      type: "object",
      properties: {}
    },
    permission: "auto",
    offline: true,
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      
      webview.reload();
      return { success: true };
    }
  },

  // ========== PAGE INTERACTION FUNCTIONS ==========
  scrollTo: {
    description: "Scroll the page to a specific position",
    parameters: {
      type: "object",
      properties: {
        position: {
          type: "string",
          enum: ["top", "bottom", "middle"],
          description: "Where to scroll"
        },
        yOffset: {
          type: "number",
          description: "Y offset in pixels (optional)"
        }
      },
      required: ["position"]
    },
    permission: "auto",
    offline: true,
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      
      try {
        await webview.executeJavaScript(`
          (function() {
            const position = '${params.position}';
            const yOffset = ${params.yOffset || 0};
            
            if (position === 'top') {
              window.scrollTo(0, yOffset);
            } else if (position === 'bottom') {
              window.scrollTo(0, document.body.scrollHeight + yOffset);
            } else if (position === 'middle') {
              window.scrollTo(0, document.body.scrollHeight / 2 + yOffset);
            }
          })()
        `);
        
        return { success: true, position: params.position };
      } catch (error) {
        throw new Error("Failed to scroll: " + error.message);
      }
    }
  },

  findInPage: {
    description: "Search for text in the current page",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to search for"
        }
      },
      required: ["text"]
    },
    permission: "auto",
    offline: true,
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      
      try {
        webview.findInPage(params.text);
        return { success: true, searchText: params.text };
      } catch (error) {
        throw new Error("Failed to search: " + error.message);
      }
    }
  },

  // ========== UTILITY FUNCTIONS ==========
  takeScreenshot: {
    description: "Take a screenshot of the current page",
    parameters: {
      type: "object",
      properties: {}
    },
    permission: "prompt",
    offline: true,
    handler: async (params, context) => {
      const { webview } = context;
      if (!webview) throw new Error("No active tab");
      
      // This will be implemented with Electron's capturePage API
      return { success: true, message: "Screenshot feature coming soon" };
    }
  }
};

// Helper function to get function by name
function getFunction(name) {
  return functionRegistry[name];
}

// Helper function to list all functions
function listFunctions() {
  return Object.keys(functionRegistry).map(name => ({
    name: name,
    description: functionRegistry[name].description,
    permission: functionRegistry[name].permission
  }));
}

// Export for use in both main and renderer processes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { functionRegistry, getFunction, listFunctions };
}

// Also expose to window for browser context
if (typeof window !== 'undefined') {
  window.functionRegistryModule = { functionRegistry, getFunction, listFunctions };
}
