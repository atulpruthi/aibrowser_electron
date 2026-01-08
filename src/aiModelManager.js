// AI Model Manager - Loads and manages AI models for the browser
// Uses local Python model server for quantized DistilBERT intent classification
// Falls back to Transformers.js for other models if needed

// Get pipeline and env from globally loaded transformers (loaded via CDN in index.html)
// Check if they exist before destructuring
if (!window.transformers) {
  console.error('FATAL: window.transformers not loaded! Make sure transformers.js CDN loads first.');
}

const { pipeline, env } = window.transformers || { pipeline: null, env: null };

if (!pipeline || !env) {
  console.warn('Transformers.js pipeline or env not available yet');
}

// Simple config for browser (without node require)
const config = {
  modelServer: {
    port: 3737,
    host: 'localhost',
    get url() { return `http://${this.host}:${this.port}`; },
    modelsPath: '/models/intent-classifier'
  },
  models: {
    intentClassifier: {
      get url() { return `${config.modelServer.url}${config.modelServer.modelsPath}`; },
      fallbackModel: 'Xenova/distilbert-base-uncased-mnli'
    }
  },
  transformers: {
    allowLocalModels: true,
    useBrowserCache: true
  }
};

// Configure environment
if (env) {
  env.allowLocalModels = config.transformers.allowLocalModels;
  env.useBrowserCache = config.transformers.useBrowserCache;
}

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
    this.useCustomModel = false;
  }

  // ========== INTENT CLASSIFICATION ==========
  // Load custom fine-tuned DistilBERT for intent classification
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

      // Custom trained model runs in Python via IPC
      // Browser uses zero-shot as fallback for when IPC isn't available
      this.models.intentClassifier = await pipeline(
        'zero-shot-classification',
        config.models.intentClassifier.fallbackModel,
        {
          progress_callback: (progress) => {
            this.loadingProgress.intentClassifier = progress;
            console.log('Fallback model loading:', progress);
          }
        }
      );
      console.log('Zero-shot classification model loaded (browser fallback)');
      console.log('Custom trained model will be used via IPC when available');
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
    // Try custom Python model via IPC first (92% accuracy)
    if (window.electronAPI && window.electronAPI.classifyIntent) {
      try {
        const response = await window.electronAPI.classifyIntent(text);
        console.log('IPC response:', response);
        if (response && response.results && !response.error) {
          console.log('Intent classification result (custom Python model):', response.results);
          this.useCustomModel = true;
          return response.results;
        } else if (response && response.error) {
          console.log('Custom Python model error:', response.error, '- falling back');
        }
      } catch (ipcError) {
        console.log('IPC to custom Python model failed, using browser fallback:', ipcError);
      }
    }
    
    // Use browser zero-shot model as fallback
    console.log('Using browser zero-shot model (IPC not available)');
    const classifier = await this.loadIntentClassifier();

    try {
      // Zero-shot classification with optimized labels
      const candidateLabels = [
        'navigate to website URL',
        'web search query',
        'scroll page',
        'go back',
        'go forward',
        'reload page',
        'click element',
        'type text',
        'close tab'
      ];

      const result = await classifier(text, candidateLabels, {
        multi_label: false
      });

      // Map to our intent names
      const intentMapping = {
        'navigate to website URL': 'navigate',
        'web search query': 'search',
        'scroll page': 'scroll',
        'go back': 'go_back',
        'go forward': 'go_forward',
        'reload page': 'reload',
        'click element': 'click',
        'type text': 'type',
        'close tab': 'close_tab'
      };

      const topIntents = result.labels.slice(0, 3).map((label, idx) => ({
        intent: intentMapping[label] || label,
        confidence: result.scores[idx]
      }));

      console.log('Intent classification result (zero-shot fallback):', topIntents);
      return topIntents;
    } catch (error) {
      console.error('Intent classification failed:', error);
      throw new Error('AI model unavailable for intent classification');
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
