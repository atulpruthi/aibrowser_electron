// Configuration for AI Browser
// Centralized configuration to avoid hardcoded values

const config = {
  // Model Server Configuration
  modelServer: {
    port: process.env.MODEL_SERVER_PORT || 3737,
    host: process.env.MODEL_SERVER_HOST || 'localhost',
    get url() {
      return `http://${this.host}:${this.port}`;
    },
    modelsPath: '/models/intent-classifier-onnx'
  },

  // Model Configuration
  models: {
    intentClassifier: {
      get url() {
        return `${config.modelServer.url}${config.modelServer.modelsPath}`;
      },
      fallbackModel: 'Xenova/distilbert-base-uncased-mnli'
    }
  },

  // Transformers.js Environment
  transformers: {
    allowLocalModels: true,
    useBrowserCache: true
  },

  // App Configuration
  app: {
    window: {
      width: 1200,
      height: 800
    }
  }
};

module.exports = config;
