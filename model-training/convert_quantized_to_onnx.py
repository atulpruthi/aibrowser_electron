"""
Convert the quantized FP16 model to ONNX format for use with Transformers.js

This script converts the FP16 quantized model to ONNX format so it can run
directly in the browser without needing a Python backend server.

Requirements:
    pip install transformers torch onnx onnxruntime
"""

import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from pathlib import Path
import json
import shutil

def convert_to_onnx(model_path, output_path):
    """Convert the quantized model to ONNX format"""
    
    print(f"Loading quantized model from {model_path}...")
    
    # Load the FP16 quantized model
    tokenizer = DistilBertTokenizer.from_pretrained(model_path)
    model = DistilBertForSequenceClassification.from_pretrained(model_path)
    model.eval()
    
    print(f"Model loaded. Converting to ONNX format...")
    
    # Create output directory
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create dummy input
    dummy_text = "navigate to google"
    inputs = tokenizer(
        dummy_text, 
        return_tensors="pt", 
        padding='max_length',
        truncation=True, 
        max_length=128
    )
    
    # Extract input_ids and attention_mask
    input_ids = inputs['input_ids']
    attention_mask = inputs['attention_mask']
    
    # Export to ONNX with simpler configuration
    onnx_path = output_dir / "model.onnx"
    
    print(f"Exporting to {onnx_path}...")
    
    try:
        with torch.no_grad():
            # Use tracing instead of scripting for better compatibility
            traced_model = torch.jit.trace(
                model,
                (input_ids, attention_mask),
                strict=False
            )
            
            torch.onnx.export(
                traced_model,
                (input_ids, attention_mask),
                str(onnx_path),
                input_names=['input_ids', 'attention_mask'],
                output_names=['logits'],
                dynamic_axes={
                    'input_ids': {0: 'batch_size', 1: 'sequence_length'},
                    'attention_mask': {0: 'batch_size', 1: 'sequence_length'},
                    'logits': {0: 'batch_size'}
                },
                opset_version=12,
                do_constant_folding=True,
                export_params=True
            )
        
        print(f"✓ ONNX model exported successfully")
    except Exception as e:
        print(f"Export failed with tracing, trying direct export...")
        
        # Fallback: direct export without tracing
        with torch.no_grad():
            torch.onnx.export(
                model,
                (input_ids, attention_mask),
                str(onnx_path),
                input_names=['input_ids', 'attention_mask'],
                output_names=['logits'],
                dynamic_axes={
                    'input_ids': {0: 'batch_size', 1: 'sequence_length'},
                    'attention_mask': {0: 'batch_size', 1: 'sequence_length'},
                    'logits': {0: 'batch_size'}
                },
                opset_version=12,
                do_constant_folding=True
            )
        print(f"✓ ONNX model exported successfully (direct export)")
    
    # Save tokenizer files
    print("Saving tokenizer files...")
    tokenizer.save_pretrained(output_path)
    
    # Create config.json compatible with Transformers.js
    config = model.config.to_dict()
    
    # Add id2label mapping for Transformers.js
    id2label = {
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
    
    config['id2label'] = id2label
    config['label2id'] = {v: k for k, v in id2label.items()}
    
    with open(output_dir / 'config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\nONNX model saved to {output_path}")
    print("\nModel files created:")
    for file in sorted(output_dir.iterdir()):
        size = file.stat().st_size / (1024 * 1024)
        print(f"  - {file.name} ({size:.2f} MB)")
    
    # Test the exported model
    print("\n--- Testing ONNX model ---")
    try:
        import onnxruntime as ort
        
        # Create inference session
        session = ort.InferenceSession(str(onnx_path))
        
        # Test with sample inputs
        test_examples = [
            "navigate to google",
            "search for AI news",
            "scroll down"
        ]
        
        INTENTS = {
            0: 'navigate',
            1: 'search',
            2: 'scroll',
            3: 'go_back',
            4: 'go_forward',
            5: 'reload',
            6: 'click',
            7: 'type',
            8: 'close_tab'
        }
        
        for text in test_examples:
            inputs = tokenizer(
                text, 
                return_tensors="np",
                padding='max_length',
                truncation=True,
                max_length=128
            )
            
            # Run inference
            outputs = session.run(
                None,
                {
                    'input_ids': inputs['input_ids'].astype('int64'),
                    'attention_mask': inputs['attention_mask'].astype('int64')
                }
            )
            
            logits = outputs[0][0]
            prediction = logits.argmax()
            
            # Softmax
            import numpy as np
            exp_logits = np.exp(logits - np.max(logits))
            probs = exp_logits / exp_logits.sum()
            
            intent = INTENTS[prediction]
            confidence = probs[prediction]
            
            print(f"  '{text}' -> {intent} ({confidence:.2f})")
        
        print("\n✓ ONNX model validation successful!")
        
    except ImportError:
        print("\nonnxruntime not installed, skipping validation")
        print("Install with: pip3 install onnxruntime")
    except Exception as e:
        print(f"\nValidation error: {e}")
    
    print("\n" + "="*60)
    print("To use this model in the browser with Transformers.js:")
    print("="*60)
    print(f"1. Copy {output_path} to your public/models/ directory")
    print("2. Load with:")
    print("   const model = await pipeline(")
    print("     'text-classification',")
    print(f"     './models/{output_dir.name}'")
    print("   );")
    print("3. Use it:")
    print("   const result = await model('navigate to google');")

def main():
    model_path = './models/distilbert-navigation-quantized'
    output_path = './models/distilbert-navigation-onnx'
    
    convert_to_onnx(model_path, output_path)

if __name__ == "__main__":
    main()
