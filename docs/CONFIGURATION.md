# AI Browser Configuration

## Environment Variables

You can customize the AI Browser behavior using environment variables:

### Model Server Configuration

```bash
# Change model server port (default: 3737)
MODEL_SERVER_PORT=4000 npm start

# Change model server host (default: localhost)
MODEL_SERVER_HOST=0.0.0.0 npm start
```

### Examples

**Run on different port:**
```bash
MODEL_SERVER_PORT=8080 npm start
```

**Allow external connections:**
```bash
MODEL_SERVER_HOST=0.0.0.0 MODEL_SERVER_PORT=3737 npm start
```

## Configuration File

All configuration is centralized in `config.js`:

```javascript
const config = {
  modelServer: {
    port: process.env.MODEL_SERVER_PORT || 3737,
    host: process.env.MODEL_SERVER_HOST || 'localhost',
    url: 'http://localhost:3737',      // Auto-generated
    modelsPath: '/models/intent-classifier'
  },
  
  models: {
    intentClassifier: {
      url: 'http://localhost:3737/models/intent-classifier',  // Auto-generated
      fallbackModel: 'Xenova/distilbert-base-uncased-mnli'
    }
  },
  
  transformers: {
    allowLocalModels: true,
    useBrowserCache: true
  },
  
  app: {
    window: {
      width: 1200,
      height: 800
    }
  }
};
```

## Changing Defaults

To change defaults, edit `config.js`:

**Change window size:**
```javascript
app: {
  window: {
    width: 1600,
    height: 900
  }
}
```

**Change fallback model:**
```javascript
models: {
  intentClassifier: {
    fallbackModel: 'Xenova/bert-base-uncased-mnli'
  }
}
```

**Disable browser cache:**
```javascript
transformers: {
  allowLocalModels: true,
  useBrowserCache: false
}
```

## No More Hardcoded Values! ✅

Before:
- ❌ Port 3737 hardcoded in main.js
- ❌ localhost:3737 hardcoded in aiModelManager.js
- ❌ Window dimensions hardcoded in main.js
- ❌ Fallback model name hardcoded in aiModelManager.js

After:
- ✅ All values in centralized config.js
- ✅ Environment variable support
- ✅ Easy to customize
- ✅ Single source of truth
