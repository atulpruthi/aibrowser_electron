"""
Fine-tune DistilBERT for Browser Navigation Intent Classification

This script fine-tunes DistilBERT to better recognize navigation intents
in natural language commands for the AI browser.

Requirements:
    pip install transformers datasets torch sklearn
"""

import torch
from transformers import (
    DistilBertTokenizer,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments,
    EarlyStoppingCallback
)
from datasets import Dataset
from sklearn.model_selection import train_test_split
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import json
import os

# Check if expanded data exists
expanded_data_path = './training_data_expanded.json'
if os.path.exists(expanded_data_path):
    print(f"Loading expanded training data from {expanded_data_path}...")
    with open(expanded_data_path, 'r') as f:
        data_loaded = json.load(f)
        training_data = [(item['text'], item['intent']) for item in data_loaded]
    print(f"Loaded {len(training_data)} examples from expanded dataset")
else:
    print("Using original training data...")
    # Define intent labels
    INTENTS = {
        'navigate': 0,
        'search': 1,
        'scroll': 2,
        'go_back': 3,
        'go_forward': 4,
        'reload': 5,
        'new_tab': 6,
        'close_tab': 7,
        'find_in_page': 8
    }

    # Training data - expand this with more examples
    training_data = [
    # Navigation examples
    ("navigate to google", "navigate"),
    ("open github.com", "navigate"),
    ("go to youtube", "navigate"),
    ("visit reddit.com", "navigate"),
    ("goto facebook", "navigate"),
    ("launch twitter.com", "navigate"),
    ("open amazon", "navigate"),
    ("go to netflix", "navigate"),
    ("navigate to stackoverflow", "navigate"),
    ("visit linkedin.com", "navigate"),
    ("open wikipedia.org", "navigate"),
    ("goto yahoo.com", "navigate"),
    ("show me github", "navigate"),
    ("take me to google", "navigate"),
    ("load reddit", "navigate"),
    
    # Search examples
    ("search for python tutorials", "search"),
    ("find information about AI", "search"),
    ("google machine learning", "search"),
    ("lookup javascript frameworks", "search"),
    ("search web for news", "search"),
    ("find latest tech articles", "search"),
    ("google how to code", "search"),
    ("search for recipes", "search"),
    ("find me a restaurant", "search"),
    ("look up weather forecast", "search"),
    ("search for hotels nearby", "search"),
    ("find cheap flights", "search"),
    ("google best laptops 2026", "search"),
    ("search programming jobs", "search"),
    ("find documentaries", "search"),
    
    # Scroll examples
    ("scroll to top", "scroll"),
    ("scroll down", "scroll"),
    ("scroll to bottom", "scroll"),
    ("scroll up", "scroll"),
    ("go to top of page", "scroll"),
    ("scroll to the bottom", "scroll"),
    ("move to top", "scroll"),
    ("go down", "scroll"),
    ("page down", "scroll"),
    ("page up", "scroll"),
    
    # Go back examples
    ("go back", "go_back"),
    ("back", "go_back"),
    ("previous page", "go_back"),
    ("navigate back", "go_back"),
    ("return to previous", "go_back"),
    
    # Go forward examples
    ("go forward", "go_forward"),
    ("forward", "go_forward"),
    ("next page", "go_forward"),
    ("navigate forward", "go_forward"),
    
    # Reload examples
    ("reload page", "reload"),
    ("refresh", "reload"),
    ("reload this page", "reload"),
    ("refresh page", "reload"),
    ("reload current page", "reload"),
    
    # New tab examples
    ("new tab", "new_tab"),
    ("open new tab", "new_tab"),
    ("create tab", "new_tab"),
    ("open another tab", "new_tab"),
    
    # Close tab examples
    ("close tab", "close_tab"),
    ("close this tab", "close_tab"),
    ("close current tab", "close_tab"),
    
    # Find in page examples
    ("find text", "find_in_page"),
    ("search in page", "find_in_page"),
    ("find on page", "find_in_page"),
    ("search for text on page", "find_in_page"),
    ]

# Build INTENTS dict from training data
INTENTS = {}
for text, intent in training_data:
    if intent not in INTENTS:
        INTENTS[intent] = len(INTENTS)

print(f"Detected {len(INTENTS)} intents: {list(INTENTS.keys())}")

def prepare_dataset(data, tokenizer, test_size=0.2):
    """Prepare training and validation datasets"""
    texts = [item[0] for item in data]
    labels = [INTENTS[item[1]] for item in data]
    
    # Split data
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=test_size, random_state=42, stratify=labels
    )
    
    # Tokenize
    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=64)
    val_encodings = tokenizer(val_texts, truncation=True, padding=True, max_length=64)
    
    # Create datasets
    train_dataset = Dataset.from_dict({
        'input_ids': train_encodings['input_ids'],
        'attention_mask': train_encodings['attention_mask'],
        'labels': train_labels
    })
    
    val_dataset = Dataset.from_dict({
        'input_ids': val_encodings['input_ids'],
        'attention_mask': val_encodings['attention_mask'],
        'labels': val_labels
    })
    
    return train_dataset, val_dataset

def compute_metrics(eval_pred):
    """Compute accuracy and F1 score"""
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    
    accuracy = accuracy_score(labels, predictions)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average='weighted'
    )
    
    return {
        'accuracy': accuracy,
        'f1': f1,
        'precision': precision,
        'recall': recall
    }

def main():
    print("Starting DistilBERT fine-tuning for navigation intents...")
    
    # Load tokenizer and model
    model_name = "distilbert-base-uncased"
    tokenizer = DistilBertTokenizer.from_pretrained(model_name)
    # Create label mappings
    id2label = {v: k for k, v in INTENTS.items()}
    label2id = INTENTS
    
    model = DistilBertForSequenceClassification.from_pretrained(
        model_name,
        num_labels=len(INTENTS),
        id2label=id2label,
        label2id=label2id
    )
    
    print(f"Loaded {model_name}")
    print(f"Number of intents: {len(INTENTS)}")
    print(f"Training examples: {len(training_data)}")
    
    # Prepare datasets
    train_dataset, val_dataset = prepare_dataset(training_data, tokenizer)
    print(f"Training set size: {len(train_dataset)}")
    print(f"Validation set size: {len(val_dataset)}")
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir='./models/distilbert-navigation',
        num_train_epochs=10,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        warmup_steps=50,
        weight_decay=0.01,
        logging_dir='./logs',
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
    )
    
    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
    )
    
    # Train
    print("\nStarting training...")
    trainer.train()
    
    # Evaluate
    print("\nEvaluating model...")
    eval_results = trainer.evaluate()
    print(f"Evaluation results: {eval_results}")
    
    # Save model
    model_path = './models/distilbert-navigation-finetuned'
    trainer.save_model(model_path)
    tokenizer.save_pretrained(model_path)
    print(f"\nModel saved to {model_path}")
    
    # Test predictions
    print("\n--- Testing predictions ---")
    test_examples = [
        "navigate to google",
        "search for AI news",
        "scroll to top",
        "go back",
        "reload page"
    ]
    
    # Reload the model from saved checkpoint to avoid device issues
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    test_model = DistilBertForSequenceClassification.from_pretrained('./models/distilbert-navigation-finetuned')
    test_model.to(device)
    test_model.eval()
    
    for text in test_examples:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = test_model(**inputs)
            prediction = torch.argmax(outputs.logits, dim=-1).item()
            intent = [k for k, v in INTENTS.items() if v == prediction][0]
            confidence = torch.softmax(outputs.logits, dim=-1)[0][prediction].item()
            print(f"Text: '{text}' -> Intent: {intent} (confidence: {confidence:.2f})")
    
    print("\nTraining complete!")
    print(f"\nTo use this model in your browser:")
    print(f"1. Convert to ONNX format for use with Transformers.js")
    print(f"2. Or use the Python model in a backend service")

if __name__ == "__main__":
    main()
