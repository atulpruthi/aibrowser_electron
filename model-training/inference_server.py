"""
Simple inference server for the custom intent classifier
Runs as a subprocess and communicates via stdin/stdout
"""

import sys
import json
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Load model and tokenizer
model_path = "../models/distilbert-navigation-quantized"
print(json.dumps({"status": "loading", "message": "Loading model..."}), flush=True)

try:
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model.eval()
    
    # Intent labels
    intents = ['navigate', 'search', 'scroll', 'go_back', 'go_forward', 'reload', 'click', 'type', 'close_tab']
    
    print(json.dumps({"status": "ready", "message": "Model loaded successfully"}), flush=True)
    
    # Process requests from stdin
    for line in sys.stdin:
        try:
            data = json.loads(line.strip())
            text = data.get('text', '')
            
            if not text:
                print(json.dumps({"error": "No text provided"}), flush=True)
                continue
            
            # Tokenize and predict
            inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
            
            with torch.no_grad():
                outputs = model(**inputs)
                probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
                scores, indices = torch.topk(probs[0], k=3)
            
            # Format results
            results = []
            for score, idx in zip(scores.tolist(), indices.tolist()):
                results.append({
                    "intent": intents[idx],
                    "confidence": score
                })
            
            print(json.dumps({"status": "success", "results": results}), flush=True)
            
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}), flush=True)
            
except Exception as e:
    print(json.dumps({"status": "error", "message": f"Failed to load model: {str(e)}"}), flush=True)
    sys.exit(1)
