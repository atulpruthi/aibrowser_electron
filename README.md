# AI Browser

An intelligent browser powered by fine-tuned AI models for natural language navigation and control.

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run the Browser
```bash
npm start
```

## 📁 Project Structure

```
ai-browser/
├── model-training/          # Python ML training code
│   ├── train_navigation_model.py
│   ├── quantize_model.py
│   └── prepare_model_for_browser.py
│
├── src/                     # Browser application code
│   ├── main.js              # Electron main process
│   ├── config.js            # Configuration
│   ├── aiModelManager.js    # AI model management
│   └── aiIntentDetector.js  # Pure AI intent detection
│
├── renderer/                # UI code
│   ├── index.html
│   └── App.js
│
├── models/                  # Trained AI models
│   └── intent-classifier/   # 128MB quantized DistilBERT
│
└── docs/                    # Documentation
    ├── BROWSER_MODEL_GUIDE.md
    ├── PURE_AI_ARCHITECTURE.md
    └── DEPLOYMENT.md
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed organization.

## 🤖 Features

- **Pure AI Intent Detection** - No hardcoded patterns, 100% machine learning
- **Natural Language Control** - "navigate to google", "search for AI news"
- **Fine-tuned DistilBERT** - 92% accuracy, 9 intent types
- **Embedded Model Server** - Runs locally on port 3737
- **Quantized Models** - FP16 optimization, 128MB size

## 📚 Documentation

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Code organization
- [docs/PURE_AI_ARCHITECTURE.md](docs/PURE_AI_ARCHITECTURE.md) - AI architecture
- [docs/BROWSER_MODEL_GUIDE.md](docs/BROWSER_MODEL_GUIDE.md) - Model usage
- [docs/CONFIGURATION.md](docs/CONFIGURATION.md) - Configuration options
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Build installers
- [model-training/README_TRAINING.md](model-training/README_TRAINING.md) - Train models

## 🧠 Training Models

See [model-training/](model-training/) folder for training scripts:

```bash
cd model-training
python3 train_navigation_model.py      # Train model
python3 quantize_model.py              # Quantize to FP16
python3 prepare_model_for_browser.py   # Prepare for browser
```

## 🏗️ Building Installers

```bash
npm install --save-dev electron-builder
npm run build:mac      # macOS .dmg
npm run build:win      # Windows .exe
npm run build:linux    # Linux AppImage
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

## 🔧 Configuration

Edit [src/config.js](src/config.js) or use environment variables:

```bash
MODEL_SERVER_PORT=8080 npm start
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for all options.

## 🎯 Supported Intents

| Intent | Example |
|--------|---------|
| navigate | "go to google.com" |
| search | "search for AI news" |
| scroll | "scroll to bottom" |
| go_back | "go back" |
| go_forward | "go forward" |
| reload | "refresh page" |
| click | "click the button" |
| type | "type hello world" |
| close_tab | "close this tab" |

## 📊 Model Performance

- **Accuracy:** 92% validation
- **F1 Score:** 89.2%
- **Model Size:** 128 MB (FP16)
- **Inference:** ~50-100ms (browser)
- **Training Data:** 65 examples

## 🛠️ Technology Stack

**Browser:**
- Electron 39.2.7
- Express (model server)
- Transformers.js (inference)

**Training:**
- Python 3.14
- PyTorch 2.9
- Transformers 4.57
- DistilBERT

## 📦 Dependencies

```json
{
  "dependencies": {
    "@xenova/transformers": "^2.17.2",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "electron": "^39.2.7",
    "electron-builder": "^24.13.3"
  }
}
```

## 🧪 Testing

```bash
# Test model loading
open test-intent-classifier.html

# Test browser
npm start
```

## 📝 License

ISC

## 👤 Author

Your Name

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Train/test models in `model-training/`
4. Update browser code in `src/`
5. Submit a pull request

---

**See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete project organization details.**
