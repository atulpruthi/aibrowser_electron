"""
Generate tokenizer.json file for Transformers.js compatibility
"""

from transformers import AutoTokenizer
import json

# Load the tokenizer from the quantized model
tokenizer = AutoTokenizer.from_pretrained('../models/distilbert-navigation-quantized')

# Save in the new format that includes tokenizer.json
tokenizer.save_pretrained('../models/intent-classifier')

print("✓ Generated tokenizer.json in ../models/intent-classifier/")
print("\nFiles now available:")
import os
for f in os.listdir('../models/intent-classifier'):
    if not f.startswith('.'):
        print(f"  - {f}")
