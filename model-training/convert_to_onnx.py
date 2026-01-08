"""
Convert fine-tuned DistilBERT model to ONNX format for Transformers.js

This script converts the PyTorch model to ONNX format so it can be used
in the browser with Transformers.js.

Requirements:
    pip install transformers torch onnx
"""

import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from pathlib import Path
import json

def convert_to_onnx(model_path, output_path):
    """Convert PyTorch model to ONNX format"""
    
    print(f"Loading model from {model_path}...")
    
    # Load the fine-tuned model
    tokenizer = DistilBertTokenizer.from_pretrained(model_path)
    model = DistilBertForSequenceClassification.from_pretrained(model_path)
    model.eval()
    
    print("Converting to ONNX format...")
    
    # Create output directory
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create dummy input for ONNX export
    dummy_text = "navigate to google"
    inputs = tokenizer(dummy_text, return_tensors="pt", padding=True, truncation=True, max_length=128)
    
    # Export to ONNX
    onnx_path = output_dir / "model.onnx"
    
    # Use legacy exporter with opset 14 for SDPA support
    print(f"Exporting to {onnx_path}...")
    with torch.no_grad():
        # Set model to use non-SDPA attention for ONNX compatibility
        model.config.attn_implementation = "eager"
        model.config._attn_implementation = "eager"
        
        torch.onnx.export(
            model,
            (inputs['input_ids'], inputs['attention_mask']),
            str(onnx_path),
            input_names=['input_ids', 'attention_mask'],
            output_names=['logits'],
            dynamic_axes={
                'input_ids': {0: 'batch_size', 1: 'sequence'},
                'attention_mask': {0: 'batch_size', 1: 'sequence'},
                'logits': {0: 'batch_size'}
            },
            opset_version=14,
            do_constant_folding=True,
            export_params=True,
            dynamo=False  # Use legacy exporter
        )
    
    # Save tokenizer and config
    tokenizer.save_pretrained(output_path)
    model.config.save_pretrained(output_path)
    
    print(f"ONNX model saved to {output_path}")
    print("\nModel files created:")
    for file in output_dir.iterdir():
        print(f"  - {file.name}")
    
    print("\nTo use in browser with Transformers.js:")
    print("1. Host these files on a web server or CDN")
    print("2. Update your App.js to load this model instead:")
    print(f"   await pipeline('text-classification', 'path/to/{output_path}')")

def main():
    # Paths
    model_path = './models/distilbert-navigation-finetuned'
    output_path = './models/distilbert-navigation-onnx'
    
    # Check if fine-tuned model exists
    if not Path(model_path).exists():
        print(f"Error: Fine-tuned model not found at {model_path}")
        print("Please run train_navigation_model.py first")
        return
    
    # Convert
    convert_to_onnx(model_path, output_path)

if __name__ == "__main__":
    main()
