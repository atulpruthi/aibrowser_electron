# Fine-tuning DistilBERT for Navigation

This guide explains how to fine-tune DistilBERT specifically for browser navigation intent classification.

## Why Fine-tune?

The current browser uses a generic DistilBERT model trained on MNLI (Multi-Genre Natural Language Inference). Fine-tuning on navigation-specific examples will:
- Improve accuracy for browser commands
- Reduce latency by using a smaller, specialized model
- Better handle domain-specific vocabulary

## Setup

### 1. Install Python Dependencies

```bash
pip install transformers datasets torch sklearn optimum[exporters]
```

### 2. Prepare Training Data

Edit `train_navigation_model.py` and add more training examples to the `training_data` list. The more diverse examples you provide, the better the model will perform.

Example format:
```python
("your command text", "intent_label")
```

Current intents:
- `navigate` - Opening URLs (e.g., "go to google.com")
- `search` - Web searches (e.g., "search for python tutorials")
- `scroll` - Page scrolling (e.g., "scroll to top")
- `go_back` - Navigate back
- `go_forward` - Navigate forward
- `reload` - Refresh page
- `new_tab` - Open new tab
- `close_tab` - Close tab
- `find_in_page` - Find text on page

### 3. Train the Model

```bash
python train_navigation_model.py
```

This will:
- Load the base DistilBERT model
- Fine-tune on your navigation examples
- Save the model to `./models/distilbert-navigation-finetuned`
- Show evaluation metrics (accuracy, F1 score)
- Test predictions on sample commands

Training takes 5-15 minutes on a modern CPU (faster with GPU).

### 4. Convert to ONNX (for browser use)

```bash
python convert_to_onnx.py
```

This converts the PyTorch model to ONNX format compatible with Transformers.js.

Output: `./models/distilbert-navigation-onnx/`

## Using the Fine-tuned Model

### Option 1: Local Usage (Development)

1. Copy the ONNX model files to a public directory
2. Update `App.js`:

```javascript
// Replace the current model loading
aiIntentClassifier = await pipeline(
  'text-classification',
  './models/distilbert-navigation-onnx'
);
```

### Option 2: Hosted Model (Production)

1. Upload the ONNX model to a CDN or web server
2. Update `App.js`:

```javascript
aiIntentClassifier = await pipeline(
  'text-classification',
  'https://your-cdn.com/models/distilbert-navigation-onnx'
);
```

## Improving the Model

### Add More Training Data

The key to better performance is diverse training examples. Add variations like:

```python
# Different phrasings
("open google", "navigate"),
("take me to google", "navigate"),
("show google", "navigate"),
("load google.com", "navigate"),

# With typos
("nagivate to google", "navigate"),
("serach for news", "search"),

# Casual language
("gimme google", "navigate"),
("find stuff about AI", "search"),
```

### Balance Classes

Ensure each intent has roughly the same number of examples (50+ per intent recommended).

### Validation

After training, test the model with real user commands:

```python
python -c "
from transformers import pipeline
classifier = pipeline('text-classification', './models/distilbert-navigation-finetuned')
print(classifier('go to github'))
"
```

## Advanced: Continuous Learning

To continuously improve the model:

1. Log user commands that fail
2. Manually label them with correct intents
3. Add to training data
4. Retrain periodically

## Model Size

- **Base DistilBERT**: ~250 MB
- **Fine-tuned DistilBERT**: ~250 MB
- **ONNX format**: ~250 MB (same size, different format)

The model loads once at startup and runs in-browser without server calls.

## Troubleshooting

### Low Accuracy
- Add more diverse training examples
- Balance classes (equal examples per intent)
- Increase training epochs
- Add data augmentation

### Model Too Large
- Use DistilBERT (already distilled from BERT)
- Consider further quantization
- Use a smaller model like MobileBERT

### Slow Inference
- Ensure ONNX conversion worked
- Use WebAssembly backend in Transformers.js
- Consider caching common predictions

## Performance Benchmarks

Expected performance with 50+ examples per intent:
- **Accuracy**: 85-95%
- **F1 Score**: 0.85-0.95
- **Inference Time**: 50-200ms (browser, CPU)
- **Model Load Time**: 2-5 seconds

## Next Steps

1. Collect more real user commands
2. Add new intents as needed
3. Implement A/B testing to compare models
4. Monitor and log classification confidence scores
5. Retrain quarterly with new data
