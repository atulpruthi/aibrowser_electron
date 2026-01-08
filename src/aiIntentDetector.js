// AI-Powered Intent Detector
// Uses DistilBERT for intelligent intent classification
// Pure AI - No hardcoded patterns!

import aiModelManager from './aiModelManager.js';

class AIIntentDetector {
  constructor(functionRegistry) {
    this.registry = functionRegistry;
  }

  // Main intent detection method - Pure AI
  async detectIntent(userInput, context = {}) {
    return await this.detectIntentWithAI(userInput, context);
  }

  // AI-powered intent detection
  async detectIntentWithAI(userInput, context) {
    try {
      // Get intent classification from DistilBERT
      const intents = await aiModelManager.classifyIntent(userInput);
      const topIntent = intents[0];

      console.log('AI detected intent:', topIntent);

      // Map AI intent to function and extract parameters using AI
      return await this.mapIntentToFunction(topIntent.intent, userInput, topIntent.confidence, intents);
    } catch (error) {
      console.error('AI intent detection failed:', error);
      throw new Error('Intent detection unavailable. AI model not loaded.');
    }
  }

  // Map AI-detected intent to specific functions
  async mapIntentToFunction(intentLabel, userInput, confidence, allIntents) {
    const result = [];

    switch (intentLabel) {
      case 'navigate':
        const url = await this.extractUrlWithAI(userInput);
        if (url) {
          result.push({
            type: 'navigation',
            function: 'navigate',
            params: { url: url },
            confidence: confidence
          });
        }
        break;

      case 'search':
        const query = await this.extractSearchQueryWithAI(userInput);
        result.push({
          type: 'search',
          function: 'search',
          params: { query: query },
          confidence: confidence
        });
        break;

      case 'scroll':
        const scrollParams = await this.extractScrollParamsWithAI(userInput);
        result.push({
          type: 'interaction',
          function: 'scrollTo',
          params: scrollParams,
          confidence: confidence
        });
        break;

      case 'go_back':
        result.push({
          type: 'navigation',
          function: 'goBack',
          params: {},
          confidence: confidence
        });
        break;

      case 'go_forward':
        result.push({
          type: 'navigation',
          function: 'goForward',
          params: {},
          confidence: confidence
        });
        break;

      case 'reload':
        result.push({
          type: 'navigation',
          function: 'reload',
          params: {},
          confidence: confidence
        });
        break;

      case 'click':
        const clickTarget = await this.extractClickTargetWithAI(userInput);
        result.push({
          type: 'interaction',
          function: 'click',
          params: { selector: clickTarget },
          confidence: confidence
        });
        break;

      case 'type':
        const typeParams = await this.extractTypeParamsWithAI(userInput);
        result.push({
          type: 'interaction',
          function: 'type',
          params: typeParams,
          confidence: confidence
        });
        break;

      case 'close_tab':
        result.push({
          type: 'tab-management',
          function: 'closeTab',
          params: {},
          confidence: confidence
        });
        break;

      default:
        // If confidence is too low, suggest alternatives
        if (confidence < 0.6 && allIntents.length > 1) {
          console.log('Low confidence, considering alternatives:', allIntents);
          // Try second best intent
          return await this.mapIntentToFunction(
            allIntents[1].intent,
            userInput,
            allIntents[1].confidence,
            allIntents.slice(1)
          );
        }
        console.warn('Unknown intent:', intentLabel);
        break;
    }

    return result;
  }

  // AI-based parameter extraction methods
  async extractUrlWithAI(userInput) {
    // Simple extraction - everything after intent keywords is likely the URL
    const input = userInput.toLowerCase();
    const keywords = ['navigate', 'go to', 'open', 'visit'];
    
    for (const keyword of keywords) {
      const index = input.indexOf(keyword);
      if (index !== -1) {
        let url = userInput.substring(index + keyword.length).trim();
        // Remove common punctuation
        url = url.replace(/[.,!?]+$/, '');
        if (url) return url;
      }
    }
    
    // Check if input contains URL-like patterns
    if (input.includes('.com') || input.includes('.org') || 
        input.includes('.net') || input.includes('http')) {
      return userInput.replace(/[.,!?]+$/, '');
    }
    
    return userInput;
  }

  async extractSearchQueryWithAI(userInput) {
    // Remove search intent keywords
    const input = userInput.toLowerCase();
    const keywords = ['search', 'find', 'look up', 'google', 'for'];
    
    let query = userInput;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      query = query.replace(regex, '').trim();
    }
    
    return query.replace(/[.,!?]+$/, '') || userInput;
  }

  async extractScrollParamsWithAI(userInput) {
    const input = userInput.toLowerCase();
    
    if (input.includes('top') || input.includes('beginning') || input.includes('start')) {
      return { position: 'top' };
    } else if (input.includes('bottom') || input.includes('end')) {
      return { position: 'bottom' };
    } else if (input.includes('middle') || input.includes('center')) {
      return { position: 'middle' };
    }
    
    return { position: 'smooth' };
  }

  async extractClickTargetWithAI(userInput) {
    // Extract what to click from the input
    const input = userInput.toLowerCase();
    const keywords = ['click', 'press', 'tap', 'on', 'the'];
    
    let target = userInput;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      target = target.replace(regex, '').trim();
    }
    
    return target.replace(/[.,!?]+$/, '') || 'button';
  }

  async extractTypeParamsWithAI(userInput) {
    // Extract text to type
    const input = userInput.toLowerCase();
    const keywords = ['type', 'write', 'enter', 'input'];
    
    let text = userInput;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      text = text.replace(regex, '').trim();
    }
    
    return { text: text.replace(/[.,!?]+$/, '') };
  }

  // Check if AI models are ready
  async isAIReady() {
    return aiModelManager.isReady();
  }

  // Get AI loading status
  getAIStatus() {
    return aiModelManager.getLoadingStatus();
  }
}

export default AIIntentDetector;
