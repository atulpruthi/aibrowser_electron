// AI-Powered Intent Detector
// Uses DistilBERT for intelligent intent classification

import aiModelManager from './aiModelManager.js';

class AIIntentDetector {
  constructor(functionRegistry) {
    this.registry = functionRegistry;
    this.useAI = true; // Set to false to use fallback pattern matching
  }

  // Main intent detection method
  async detectIntent(userInput, context = {}) {
    if (this.useAI && await this.isAIReady()) {
      return await this.detectIntentWithAI(userInput, context);
    } else {
      // Fallback to pattern matching
      return this.detectIntentWithPatterns(userInput, context);
    }
  }

  // AI-powered intent detection
  async detectIntentWithAI(userInput, context) {
    try {
      // Get intent classification from DistilBERT
      const intents = await aiModelManager.classifyIntent(userInput);
      const topIntent = intents[0];

      console.log('AI detected intent:', topIntent);

      // Map AI intent to function and extract parameters
      return await this.mapIntentToFunction(topIntent.intent, userInput, topIntent.confidence);
    } catch (error) {
      console.error('AI intent detection failed, falling back to patterns:', error);
      return this.detectIntentWithPatterns(userInput, context);
    }
  }

  // Map AI-detected intent to specific functions
  async mapIntentToFunction(intentLabel, userInput, confidence) {
    const input = userInput.toLowerCase();
    const result = [];

    switch (intentLabel) {
      case 'navigate to URL':
        const url = this.extractUrl(userInput);
        if (url) {
          result.push({
            type: 'navigation',
            function: 'navigate',
            params: { url: url },
            confidence: confidence
          });
        }
        break;

      case 'search the web':
        const query = this.extractSearchQuery(userInput) || userInput;
        result.push({
          type: 'search',
          function: 'search',
          params: { query: query },
          confidence: confidence
        });
        break;

      case 'extract page content':
        result.push({
          type: 'extraction',
          function: 'extractPageContent',
          params: { format: 'text' },
          confidence: confidence
        });
        break;

      case 'get page information':
        result.push({
          type: 'info',
          function: 'getPageInfo',
          params: {},
          confidence: confidence
        });
        break;

      case 'extract links':
        result.push({
          type: 'extraction',
          function: 'extractLinks',
          params: {},
          confidence: confidence
        });
        break;

      case 'scroll page':
        const position = input.includes('top') ? 'top' : 
                        input.includes('bottom') ? 'bottom' : 'middle';
        result.push({
          type: 'interaction',
          function: 'scrollTo',
          params: { position: position },
          confidence: confidence
        });
        break;

      case 'go back':
        result.push({
          type: 'navigation',
          function: 'goBack',
          params: {},
          confidence: confidence
        });
        break;

      case 'go forward':
        result.push({
          type: 'navigation',
          function: 'goForward',
          params: {},
          confidence: confidence
        });
        break;

      case 'reload page':
        result.push({
          type: 'navigation',
          function: 'reload',
          params: {},
          confidence: confidence
        });
        break;

      case 'open new tab':
        result.push({
          type: 'tab-management',
          function: 'openTab',
          params: {},
          confidence: confidence
        });
        break;

      case 'close tab':
        result.push({
          type: 'tab-management',
          function: 'closeTab',
          params: {},
          confidence: confidence
        });
        break;

      case 'find text in page':
        const text = this.extractSearchQuery(userInput);
        if (text) {
          result.push({
            type: 'interaction',
            function: 'findInPage',
            params: { text: text },
            confidence: confidence
          });
        }
        break;

      case 'general question':
      case 'command':
      default:
        // Try pattern matching as fallback
        return this.detectIntentWithPatterns(userInput, {});
    }

    return result;
  }

  // Fallback pattern matching (same as Phase 2)
  detectIntentWithPatterns(userInput, context) {
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

    return intents;
  }

  // Helper methods
  matchPattern(input, patterns) {
    return patterns.some(pattern => input.includes(pattern));
  }

  extractUrl(input) {
    const urlMatch = input.match(/(?:go to|open|visit|navigate to)\s+(.+)/i);
    if (urlMatch) {
      let url = urlMatch[1].trim();
      url = url.replace(/[.,!?]+$/, '');
      return url;
    }
    
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

  // Check if AI models are ready
  async isAIReady() {
    return aiModelManager.isReady();
  }

  // Get AI loading status
  getAIStatus() {
    return aiModelManager.getLoadingStatus();
  }

  // Enable/disable AI
  setUseAI(enabled) {
    this.useAI = enabled;
  }
}

export default AIIntentDetector;
