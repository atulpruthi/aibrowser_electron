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
