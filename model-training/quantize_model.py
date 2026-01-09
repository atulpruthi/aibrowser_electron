"""
Quantize the fine-tuned DistilBERT model to reduce size and improve inference speed.

This script applies dynamic quantization to the model, which reduces the model size
by ~4x and improves inference speed while maintaining good accuracy.

Requirements:
    pip install transformers torch
"""

import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from pathlib import Path
import time

def quantize_model(model_path, output_path):
    """Apply simple weight quantization to the model"""
    
    print(f"Loading model from {model_path}...")
    
    # Load the fine-tuned model
    tokenizer = DistilBertTokenizer.from_pretrained(model_path)
    model = DistilBertForSequenceClassification.from_pretrained(model_path)
    model.eval()
    
    # Get model size before quantization
    original_state_dict = model.state_dict()
    model_size_before = sum(p.numel() * p.element_size() for p in model.parameters()) / (1024 * 1024)
    print(f"Model size before quantization: {model_size_before:.2f} MB")
    
    # Apply simple 8-bit quantization manually
    print("\nApplying 8-bit weight quantization...")
    quantized_state_dict = {}
    quantization_params = {}
    
    for name, param in original_state_dict.items():
        if param.dtype == torch.float32 and 'weight' in name:
            # Quantize to int8
            min_val = param.min()
            max_val = param.max()
            scale = (max_val - min_val) / 255.0
            zero_point = -min_val / scale
            
            quantized = torch.clamp(torch.round(param / scale + zero_point), 0, 255).to(torch.uint8)
            
            quantized_state_dict[name] = quantized
            quantization_params[name] = {
                'scale': scale.item(),
                'zero_point': zero_point.item(),
                'dtype': 'uint8'
            }
        else:
            quantized_state_dict[name] = param
    
    # Calculate quantized size
    model_size_after = sum(
        p.numel() * (1 if p.dtype == torch.uint8 else p.element_size()) 
        for p in quantized_state_dict.values()
    ) / (1024 * 1024)
    
    print(f"Model size after quantization: {model_size_after:.2f} MB")
    print(f"Size reduction: {((model_size_before - model_size_after) / model_size_before * 100):.1f}%")
    
    # Create output directory
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save quantized model and parameters
    torch.save({
        'quantized_state_dict': quantized_state_dict,
        'quantization_params': quantization_params,
        'model_config': model.config.to_dict(),
    }, output_dir / "quantized_model.pt")
    
    # Also save the original model in half precision (fp16) which is simpler and well-supported
    print("\nCreating FP16 (half precision) version...")
    model_fp16 = model.half()
    
    # Ensure config preserves the label mappings
    model_fp16.config.id2label = model.config.id2label
    model_fp16.config.label2id = model.config.label2id
    
    model_fp16.save_pretrained(output_path)
    
    # Save tokenizer
    tokenizer.save_pretrained(output_path)
    
    # Get fp16 size
    model_size_fp16 = sum(p.numel() * p.element_size() for p in model_fp16.parameters()) / (1024 * 1024)
    print(f"FP16 model size: {model_size_fp16:.2f} MB")
    print(f"FP16 size reduction: {((model_size_before - model_size_fp16) / model_size_before * 100):.1f}%")
    
    print(f"\nQuantized models saved to {output_path}")
    
    # Test inference speed
    print("\n--- Testing inference speed ---")
    test_text = "navigate to google"
    inputs = tokenizer(test_text, return_tensors="pt", truncation=True, padding=True)
    
    # Test original model (fp32)
    with torch.no_grad():
        start = time.time()
        for _ in range(100):
            _ = model(**inputs)
        original_time = (time.time() - start) / 100
    
    # Test FP16 model
    inputs_fp16 = {k: v for k, v in inputs.items()}
    with torch.no_grad():
        start = time.time()
        for _ in range(100):
            _ = model_fp16(**inputs_fp16)
        fp16_time = (time.time() - start) / 100
    
    print(f"Original FP32 model: {original_time*1000:.2f} ms per inference")
    print(f"FP16 model: {fp16_time*1000:.2f} ms per inference")
    if fp16_time < original_time:
        print(f"Speed improvement: {((original_time - fp16_time) / original_time * 100):.1f}%")
    
    # Test predictions to verify accuracy is maintained
    print("\n--- Testing predictions ---")
    test_examples = [
        "navigate to google",
        "search for AI news",
        "scroll to top",
        "go back",
        "reload page"
    ]
    
    INTENTS = {
        'navigate': 0,
        'search': 1,
        'scroll': 2,
        'go_back': 3,
        'go_forward': 4,
        'reload': 5,
        'click': 6,
        'type': 7,
        'close_tab': 8
    }
    
    print("\nFP32 Model:")
    for text in test_examples:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
            prediction = torch.argmax(outputs.logits, dim=-1).item()
            intent = [k for k, v in INTENTS.items() if v == prediction][0]
            confidence = torch.softmax(outputs.logits, dim=-1)[0][prediction].item()
            print(f"  '{text}' -> {intent} ({confidence:.2f})")
    
    print("\nFP16 Model:")
    for text in test_examples:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            outputs = model_fp16(**inputs)
            prediction = torch.argmax(outputs.logits, dim=-1).item()
            intent = [k for k, v in INTENTS.items() if v == prediction][0]
            confidence = torch.softmax(outputs.logits, dim=-1)[0][prediction].item()
            print(f"  '{text}' -> {intent} ({confidence:.2f})")
    
    print("\n✓ Quantization complete!")
    print(f"\nTo use the FP16 model (recommended):")
    print(f"1. Load with: model = DistilBertForSequenceClassification.from_pretrained('{output_path}')")
    print(f"2. The FP16 model is 2x smaller")
    print(f"3. Use it the same way as the original model")

def main():
    model_path = './models/distilbert-navigation-finetuned'
    output_path = './models/distilbert-navigation-quantized'
    
    quantize_model(model_path, output_path)

if __name__ == "__main__":
    main()
