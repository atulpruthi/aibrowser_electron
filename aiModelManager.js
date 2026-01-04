// AI Model Manager - Loads and manages AI models for the browser
// Uses Transformers.js to run models in the browser via ONNX Runtime

import { pipeline, env } from '@xenova/transformers';

// Configure environment
env.allowLocalModels = true;
env.useBrowserCache = true;

class AIModelManager {
  constructor() {
    this.models = {
      intentClassifier: null,
      sentimentAnalyzer: null,
      embeddings: null
    };
    
    this.isLoading = {
      intentClassifier: false,
      sentimentAnalyzer: false,
      embeddings: false
    };
    
    this.loadingProgress = {};
  }

  // ========== INTENT CLASSIFICATION ==========
  // Load DistilBERT for intent classification
  async loadIntentClassifier() {
    if (this.models.intentClassifier) {
      return this.models.intentClassifier;
    }

    if (this.isLoading.intentClassifier) {
      // Wait for existing load to complete
      while (this.isLoading.intentClassifier) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.models.intentClassifier;
    }

    try {
      this.isLoading.intentClassifier = true;
      console.log('Loading intent classification model...');

      // Use zero-shot classification for flexible intent detection
      this.models.intentClassifier = await pipeline(
        'zero-shot-classification',
        'Xenova/distilbert-base-uncased-mnli',
        {
          progress_callback: (progress) => {
            this.loadingProgress.intentClassifier = progress;
            console.log('Intent classifier loading:', progress);
          }
        }
      );

      console.log('Intent classification model loaded successfully');
      return this.models.intentClassifier;
    } catch (error) {
      console.error('Failed to load intent classifier:', error);
      throw error;
    } finally {
      this.isLoading.intentClassifier = false;
    }
  }

  // Classify user intent using AI
  async classifyIntent(text) {
    const classifier = await this.loadIntentClassifier();

    // Define possible intents
    const candidateLabels = [
      'navigate to URL',
      'search the web',
      'extract page content',
      'get page information',
      'extract links',
      'scroll page',
      'go back',
      'go forward',
      'reload page',
      'open new tab',
      'close tab',
      'find text in page',
      'general question',
      'command'
    ];

    try {
      const result = await classifier(text, candidateLabels, {
        multi_label: false
      });

      // Return top 3 intents with scores
      const topIntents = result.labels.slice(0, 3).map((label, idx) => ({
        intent: label,
        confidence: result.scores[idx]
      }));

      console.log('Intent classification result:', topIntents);
      return topIntents;
    } catch (error) {
      console.error('Intent classification failed:', error);
      return [{ intent: 'general question', confidence: 0.5 }];
    }
  }

  // ========== SENTIMENT ANALYSIS ==========
  async loadSentimentAnalyzer() {
    if (this.models.sentimentAnalyzer) {
      return this.models.sentimentAnalyzer;
    }

    if (this.isLoading.sentimentAnalyzer) {
      while (this.isLoading.sentimentAnalyzer) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.models.sentimentAnalyzer;
    }

    try {
      this.isLoading.sentimentAnalyzer = true;
      console.log('Loading sentiment analysis model...');

      this.models.sentimentAnalyzer = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );

      console.log('Sentiment analysis model loaded successfully');
      return this.models.sentimentAnalyzer;
    } catch (error) {
      console.error('Failed to load sentiment analyzer:', error);
      throw error;
    } finally {
      this.isLoading.sentimentAnalyzer = false;
    }
  }

  async analyzeSentiment(text) {
    const analyzer = await this.loadSentimentAnalyzer();
    const result = await analyzer(text);
    return result[0];
  }

  // ========== EMBEDDINGS ==========
  async loadEmbeddings() {
    if (this.models.embeddings) {
      return this.models.embeddings;
    }

    if (this.isLoading.embeddings) {
      while (this.isLoading.embeddings) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.models.embeddings;
    }

    try {
      this.isLoading.embeddings = true;
      console.log('Loading embeddings model...');

      this.models.embeddings = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );

      console.log('Embeddings model loaded successfully');
      return this.models.embeddings;
    } catch (error) {
      console.error('Failed to load embeddings:', error);
      throw error;
    } finally {
      this.isLoading.embeddings = false;
    }
  }

  async getEmbedding(text) {
    const embedder = await this.loadEmbeddings();
    const result = await embedder(text, { pooling: 'mean', normalize: true });
    return result;
  }

  // ========== UTILITY METHODS ==========
  
  // Preload models in background
  async preloadModels() {
    console.log('Preloading AI models...');
    try {
      await this.loadIntentClassifier();
      console.log('All models preloaded successfully');
    } catch (error) {
      console.error('Failed to preload models:', error);
    }
  }

  // Check if models are ready
  isReady() {
    return this.models.intentClassifier !== null;
  }

  // Get loading status
  getLoadingStatus() {
    return {
      intentClassifier: {
        loaded: this.models.intentClassifier !== null,
        loading: this.isLoading.intentClassifier,
        progress: this.loadingProgress.intentClassifier
      },
      sentimentAnalyzer: {
        loaded: this.models.sentimentAnalyzer !== null,
        loading: this.isLoading.sentimentAnalyzer
      },
      embeddings: {
        loaded: this.models.embeddings !== null,
        loading: this.isLoading.embeddings
      }
    };
  }

  // Unload models to free memory
  unloadModels() {
    this.models = {
      intentClassifier: null,
      sentimentAnalyzer: null,
      embeddings: null
    };
    console.log('Models unloaded');
  }
}

// Export singleton instance
const aiModelManager = new AIModelManager();
export default aiModelManager;
