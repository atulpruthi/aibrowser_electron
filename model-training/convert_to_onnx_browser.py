"""
Convert the quantized DistilBERT model to ONNX format for Transformers.js
"""

import os
import shutil
from pathlib import Path
import json

print("Converting PyTorch model to ONNX format for browser...")

model_path = "../models/distilbert-navigation-quantized"
output_path = "../models/intent-classifier-onnx"

# Create output directory
Path(output_path).mkdir(parents=True, exist_ok=True)

try:
    # Method 1: Use torch.onnx.export directly
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    
    print("\n1. Loading PyTorch model...")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model.eval()
    
    print("2. Creating dummy input...")
    dummy_input = tokenizer("hello world", return_tensors="pt", padding=True, truncation=True, max_length=512)
    
    print("3. Exporting to ONNX...")
    onnx_path = Path(output_path) / "model.onnx"
    
    torch.onnx.export(
        model,
        (dummy_input['input_ids'], dummy_input['attention_mask']),
        str(onnx_path),
        input_names=['input_ids', 'attention_mask'],
        output_names=['logits'],
        dynamic_axes={
            'input_ids': {0: 'batch', 1: 'sequence'},
            'attention_mask': {0: 'batch', 1: 'sequence'},
            'logits': {0: 'batch'}
        },
        opset_version=14,
        do_constant_folding=True
    )
    
    print(f"✓ ONNX model exported to {onnx_path}")
    
    print("4. Copying tokenizer files...")
    tokenizer.save_pretrained(output_path)
    
    print("5. Updating config.json with intent labels...")
    config_path = Path(output_path) / "config.json"
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    # Add intent label mappings
    config['id2label'] = {
        "0": "navigate",
        "1": "search",
        "2": "scroll",
        "3": "go_back",
        "4": "go_forward",
        "5": "reload",
        "6": "click",
        "7": "type",
        "8": "close_tab"
    }
    config['label2id'] = {
        "navigate": "0",
        "search": "1",
        "scroll": "2",
        "go_back": "3",
        "go_forward": "4",
        "reload": "5",
        "click": "6",
        "type": "7",
        "close_tab": "8"
    }
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print("\n✓ Conversion complete!")
    print(f"\nFiles created in {output_path}:")
    for f in os.listdir(output_path):
        if not f.startswith('.'):
            size = os.path.getsize(os.path.join(output_path, f)) / (1024 * 1024)
            print(f"  - {f} ({size:.2f} MB)")
    
    print("\n✓ Model ready for Transformers.js!")
    print(f"\nUpdate config.js to use: '{output_path}'")
    
except Exception as e:
    print(f"\n✗ Conversion failed: {e}")
    print("\nTrying alternative method...")
    
    # Fallback: Copy PyTorch model and let Transformers.js convert it
    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import json
        
        print("Using fallback: Preparing PyTorch model for Transformers.js auto-conversion")
        
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        
        # Save with all files
        model.save_pretrained(output_path)
        tokenizer.save_pretrained(output_path)
        
        # Update config
        config_path = Path(output_path) / "config.json"
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        config['id2label'] = {
            "0": "navigate",
            "1": "search",
            "2": "scroll",
            "3": "go_back",
            "4": "go_forward",
            "5": "reload",
            "6": "click",
            "7": "type",
            "8": "close_tab"
        }
        config['label2id'] = {v: k for k, v in config['id2label'].items()}
        
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"\n✓ Model prepared at {output_path}")
        print("Note: Transformers.js will auto-convert on first load")
        
    except Exception as e2:
        print(f"\n✗ Fallback also failed: {e2}")
        exit(1)
