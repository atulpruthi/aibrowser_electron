"""
Prepare the quantized model for direct loading in Transformers.js

This script copies and prepares the model files so they can be loaded
directly by Transformers.js without needing ONNX conversion or a Python backend.
"""

import shutil
import json
from pathlib import Path

def prepare_model_for_transformersjs(model_path, output_path):
    """Prepare model files for Transformers.js"""
    
    print(f"Preparing model from {model_path}...")
    
    model_dir = Path(model_path)
    output_dir = Path(output_path)
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy necessary files
    files_to_copy = [
        'config.json',
        'model.safetensors',  # The FP16 quantized model weights
        'tokenizer.json',      # Required by Transformers.js
        'tokenizer_config.json',
        'vocab.txt',
        'special_tokens_map.json'
    ]
    
    print("\nCopying model files...")
    for filename in files_to_copy:
        src = model_dir / filename
        if src.exists():
            dst = output_dir / filename
            shutil.copy2(src, dst)
            size = dst.stat().st_size / (1024 * 1024)
            print(f"  ✓ {filename} ({size:.2f} MB)")
        else:
            print(f"  ✗ {filename} (not found)")
    
    # Update config.json to include intent labels
    config_path = output_dir / 'config.json'
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # Add id2label mapping
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
        
        print("\n  ✓ Updated config.json with intent labels")
    
    print(f"\n✓ Model prepared at {output_path}")
    print("\nTo use in your Electron app:")
    print("1. The model files are ready to be loaded by Transformers.js")
    print("2. Transformers.js will automatically convert PyTorch -> ONNX on first load")
    print("3. The converted ONNX model will be cached in the browser")
    print("\nUsage in aiModelManager.js:")
    print(f"  const model = await pipeline('text-classification', './{output_path}');")
    print(f"  const result = await model('navigate to google');")

def main():
    model_path = '../models/distilbert-navigation-quantized'
    output_path = '../models/intent-classifier'
    
    prepare_model_for_transformersjs(model_path, output_path)

if __name__ == "__main__":
    main()
