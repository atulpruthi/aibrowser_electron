// Function Orchestrator - Plans and executes function calls
// Includes: Intent Detector, Planner, Executor, Dependency Resolver

class FunctionOrchestrator {
  constructor(functionRegistry) {
    this.registry = functionRegistry;
    this.executionQueue = [];
    this.isExecuting = false;
  }

  // ========== INTENT DETECTOR ==========
  // Analyzes user input and detects what they want to do
  detectIntent(userInput, context = {}) {
    const input = userInput.toLowerCase().trim();
    const intents = [];

    // Navigation intents
    if (this.matchPattern(input, ['go to', 'open', 'navigate to', 'visit'])) {
      const url = this.extractUrl(input);
      if (url) {
        intents.push({
          type: 'navigation',
          function: 'navigate',
          params: { url: url },
          confidence: 0.9
        });
      }
    }

    // Search intents
    if (this.matchPattern(input, ['search for', 'find', 'look up', 'google'])) {
      const query = this.extractSearchQuery(input);
      if (query) {
        intents.push({
          type: 'search',
          function: 'search',
          params: { query: query },
          confidence: 0.85
        });
      }
    }

    // Content extraction intents
    if (this.matchPattern(input, ['get content', 'extract text', 'read page', 'what is on', 'what does'])) {
      intents.push({
        type: 'extraction',
        function: 'extractPageContent',
        params: { format: 'text' },
        confidence: 0.8
      });
    }

    // Link extraction
    if (this.matchPattern(input, ['get links', 'find links', 'show links', 'list links'])) {
      intents.push({
        type: 'extraction',
        function: 'extractLinks',
        params: {},
        confidence: 0.85
      });
    }

    // Page info
    if (this.matchPattern(input, ['page info', 'page title', 'current page', 'what page', 'where am i'])) {
      intents.push({
        type: 'info',
        function: 'getPageInfo',
        params: {},
        confidence: 0.9
      });
    }

    // Scroll intents
    if (this.matchPattern(input, ['scroll to top', 'go to top'])) {
      intents.push({
        type: 'interaction',
        function: 'scrollTo',
        params: { position: 'top' },
        confidence: 0.95
      });
    }
    if (this.matchPattern(input, ['scroll to bottom', 'go to bottom'])) {
      intents.push({
        type: 'interaction',
        function: 'scrollTo',
        params: { position: 'bottom' },
        confidence: 0.95
      });
    }

    // Navigation controls
    if (this.matchPattern(input, ['go back', 'back', 'previous page'])) {
      intents.push({
        type: 'navigation',
        function: 'goBack',
        params: {},
        confidence: 0.95
      });
    }
    if (this.matchPattern(input, ['go forward', 'forward', 'next page'])) {
      intents.push({
        type: 'navigation',
        function: 'goForward',
        params: {},
        confidence: 0.95
      });
    }
    if (this.matchPattern(input, ['reload', 'refresh', 'refresh page'])) {
      intents.push({
        type: 'navigation',
        function: 'reload',
        params: {},
        confidence: 0.95
      });
    }

    // Tab management
    if (this.matchPattern(input, ['new tab', 'open tab', 'create tab'])) {
      intents.push({
        type: 'tab-management',
        function: 'openTab',
        params: {},
        confidence: 0.9
      });
    }
    if (this.matchPattern(input, ['close tab', 'close this tab'])) {
      intents.push({
        type: 'tab-management',
        function: 'closeTab',
        params: {},
        confidence: 0.9
      });
    }

    // Search in page
    if (this.matchPattern(input, ['find in page', 'search in page', 'find text'])) {
      const text = this.extractSearchQuery(input);
      if (text) {
        intents.push({
          type: 'interaction',
          function: 'findInPage',
          params: { text: text },
          confidence: 0.85
        });
      }
    }

    // Multi-step intents (summarize and save)
    if (this.matchPattern(input, ['summarize', 'summary', 'tldr'])) {
      intents.push({
        type: 'multi-step',
        functions: ['extractPageContent'],
        params: [{ format: 'text' }],
        confidence: 0.8,
        requiresAI: true
      });
    }

    return intents;
  }

  // ========== PATTERN MATCHING HELPERS ==========
  matchPattern(input, patterns) {
    return patterns.some(pattern => input.includes(pattern));
  }

  extractUrl(input) {
    // Try to extract URL from input
    const urlMatch = input.match(/(?:go to|open|visit|navigate to)\s+(.+)/i);
    if (urlMatch) {
      let url = urlMatch[1].trim();
      // Remove trailing punctuation
      url = url.replace(/[.,!?]+$/, '');
      return url;
    }
    
    // Check if input itself is a URL
    if (input.includes('.com') || input.includes('.org') || input.includes('.net')) {
      return input;
    }
    
    return null;
  }

  extractSearchQuery(input) {
    const patterns = [
      /(?:search for|find|look up|google)\s+(.+)/i,
      /(?:find in page|search in page|find text)\s+(.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1].trim().replace(/[.,!?]+$/, '');
      }
    }
    
    return null;
  }

  // ========== PLANNER ==========
  // Creates an execution plan from detected intents
  createPlan(intents, context = {}) {
    if (intents.length === 0) {
      return {
        success: false,
        message: "I couldn't understand what you want me to do. Try commands like 'go to google.com' or 'get page info'."
      };
    }

    // Sort by confidence
    intents.sort((a, b) => b.confidence - a.confidence);

    // Take the highest confidence intent
    const primaryIntent = intents[0];

    if (primaryIntent.type === 'multi-step') {
      // Handle multi-step operations
      return {
        success: true,
        type: 'multi-step',
        steps: primaryIntent.functions.map((func, idx) => ({
          function: func,
          params: primaryIntent.params[idx],
          order: idx
        })),
        requiresAI: primaryIntent.requiresAI
      };
    } else {
      // Single function call
      return {
        success: true,
        type: 'single',
        function: primaryIntent.function,
        params: primaryIntent.params
      };
    }
  }

  // ========== EXECUTOR ==========
  // Executes the plan and returns results
  async execute(plan, context) {
    if (!plan.success) {
      return { success: false, message: plan.message };
    }

    try {
      if (plan.type === 'single') {
        return await this.executeSingle(plan.function, plan.params, context);
      } else if (plan.type === 'multi-step') {
        return await this.executeMultiStep(plan.steps, context);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeSingle(functionName, params, context) {
    const func = this.registry[functionName];
    
    if (!func) {
      throw new Error(`Function '${functionName}' not found`);
    }

    // Check permission
    if (func.permission === 'prompt') {
      // In a real implementation, we'd ask user for permission
      // For now, we'll auto-approve
    }

    // Execute the function
    const result = await func.handler(params, context);
    
    return {
      success: true,
      function: functionName,
      result: result
    };
  }

  async executeMultiStep(steps, context) {
    const results = [];
    
    for (const step of steps) {
      const result = await this.executeSingle(step.function, step.params, context);
      results.push(result);
      
      // If any step fails, stop execution
      if (!result.success) {
        return {
          success: false,
          message: `Step ${step.order + 1} failed`,
          results: results
        };
      }
    }
    
    return {
      success: true,
      type: 'multi-step',
      results: results
    };
  }

  // ========== MAIN ENTRY POINT ==========
  // Process user input end-to-end
  async process(userInput, context) {
    try {
      // 1. Detect intent
      const intents = this.detectIntent(userInput, context);
      
      // 2. Create execution plan
      const plan = this.createPlan(intents, context);
      
      // 3. Execute plan
      const result = await this.execute(plan, context);
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper to format result for UI display
  formatResultForUI(result) {
    if (!result.success) {
      return {
        type: 'error',
        message: result.message || result.error || 'An error occurred'
      };
    }

    // Format based on function type
    if (result.function === 'navigate') {
      return {
        type: 'success',
        message: `✓ Navigated to ${result.result.url}`
      };
    } else if (result.function === 'search') {
      return {
        type: 'success',
        message: `✓ Searching for "${result.result.query}" on ${result.result.engine}`
      };
    } else if (result.function === 'extractPageContent') {
      return {
        type: 'data',
        message: '✓ Extracted page content',
        data: result.result.content
      };
    } else if (result.function === 'extractLinks') {
      return {
        type: 'data',
        message: `✓ Found ${result.result.count} links`,
        data: result.result.links
      };
    } else if (result.function === 'getPageInfo') {
      const info = result.result.pageInfo;
      return {
        type: 'data',
        message: '✓ Page information',
        data: `Title: ${info.title}\nURL: ${info.url}\nDomain: ${info.domain}`
      };
    } else if (result.function === 'scrollTo') {
      return {
        type: 'success',
        message: `✓ Scrolled to ${result.result.position}`
      };
    } else if (result.function === 'goBack' || result.function === 'goForward' || result.function === 'reload') {
      return {
        type: 'success',
        message: `✓ ${result.function} executed`
      };
    } else if (result.function === 'openTab') {
      return {
        type: 'success',
        message: `✓ Opened new tab`
      };
    } else if (result.function === 'closeTab') {
      return {
        type: 'success',
        message: `✓ Closed tab`
      };
    } else if (result.function === 'findInPage') {
      return {
        type: 'success',
        message: `✓ Searching for "${result.result.searchText}"`
      };
    }

    return {
      type: 'success',
      message: '✓ Action completed successfully'
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FunctionOrchestrator;
}
