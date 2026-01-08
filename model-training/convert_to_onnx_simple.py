"""
Simple ONNX conversion for browser compatibility
Uses optimum library which handles the conversion better
"""

import os
from pathlib import Path

try:
    from optimum.onnxruntime import ORTModelForSequenceClassification
    from transformers import AutoTokenizer
    
    print("Converting model to ONNX format...")
    
    # Load the quantized PyTorch model
    model_path = "../models/distilbert-navigation-quantized"
    output_path = "../models/intent-classifier-onnx"
    
    # Create output directory
    Path(output_path).mkdir(parents=True, exist_ok=True)
    
    # Export to ONNX using optimum
    model = ORTModelForSequenceClassification.from_pretrained(
        model_path,
        export=True  # This triggers ONNX export
    )
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    
    # Save both model and tokenizer
    model.save_pretrained(output_path)
    tokenizer.save_pretrained(output_path)
    
    print(f"\n✓ ONNX model saved to {output_path}")
    print("\nFiles created:")
    for f in os.listdir(output_path):
        if not f.startswith('.'):
            size = os.path.getsize(os.path.join(output_path, f)) / (1024 * 1024)
            print(f"  - {f} ({size:.2f} MB)")
    
except ImportError:
    print("Installing optimum library...")
    os.system("pip3 install optimum onnx onnxruntime")
    print("\nPlease run this script again after installation.")
except Exception as e:
    print(f"Error: {e}")
    print("\nTrying alternative method...")
    
    # Fallback: Just copy the PyTorch model and let Transformers.js handle it
    import shutil
    import json
    
    model_path = "../models/distilbert-navigation-quantized"
    output_path = "../models/intent-classifier"
    
    Path(output_path).mkdir(parents=True, exist_ok=True)
    
    files_to_copy = [
        'config.json',
        'model.safetensors',
        'tokenizer.json',
        'tokenizer_config.json',
        'vocab.txt',
        'special_tokens_map.json'
    ]
    
    for filename in files_to_copy:
        src = Path(model_path) / filename
        if src.exists():
            shutil.copy2(src, Path(output_path) / filename)
            print(f"  ✓ {filename}")
