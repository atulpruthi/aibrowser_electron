"""
Further expand training data with more diverse examples for all 9 intents
"""

import json

# Load existing data
with open('training_data_expanded.json', 'r') as f:
    existing_data = json.load(f)

print(f"Current examples: {len(existing_data)}")

# Additional examples for each intent
new_examples = [
    # Navigate - add 15 more examples
    {"text": "take me to amazon", "intent": "navigate"},
    {"text": "load netflix", "intent": "navigate"},
    {"text": "browse to stackoverflow", "intent": "navigate"},
    {"text": "go to wikipedia", "intent": "navigate"},
    {"text": "pull up reddit", "intent": "navigate"},
    {"text": "head to twitter", "intent": "navigate"},
    {"text": "show me linkedin", "intent": "navigate"},
    {"text": "access youtube", "intent": "navigate"},
    {"text": "visit instagram", "intent": "navigate"},
    {"text": "navigate facebook", "intent": "navigate"},
    {"text": "open up microsoft.com", "intent": "navigate"},
    {"text": "bring up apple.com", "intent": "navigate"},
    {"text": "display github", "intent": "navigate"},
    {"text": "load up ebay", "intent": "navigate"},
    {"text": "go to the bbc website", "intent": "navigate"},
    
    # Search - add 11 more examples
    {"text": "look up weather forecast", "intent": "search"},
    {"text": "find information about python", "intent": "search"},
    {"text": "google machine learning", "intent": "search"},
    {"text": "search the web for recipes", "intent": "search"},
    {"text": "look for hotels nearby", "intent": "search"},
    {"text": "find restaurants near me", "intent": "search"},
    {"text": "search best laptops 2026", "intent": "search"},
    {"text": "look up movie reviews", "intent": "search"},
    {"text": "find news about technology", "intent": "search"},
    {"text": "search for travel deals", "intent": "search"},
    {"text": "look up javascript tutorials", "intent": "search"},
    
    # Scroll - add 8 more examples
    {"text": "scroll down please", "intent": "scroll"},
    {"text": "go to the bottom", "intent": "scroll"},
    {"text": "scroll up a bit", "intent": "scroll"},
    {"text": "move to the top", "intent": "scroll"},
    {"text": "page down", "intent": "scroll"},
    {"text": "scroll to the end", "intent": "scroll"},
    {"text": "go up", "intent": "scroll"},
    {"text": "scroll down the page", "intent": "scroll"},
    
    # Close tab - add 8 more examples
    {"text": "shut this tab", "intent": "close_tab"},
    {"text": "exit this tab", "intent": "close_tab"},
    {"text": "kill this tab", "intent": "close_tab"},
    {"text": "remove this tab", "intent": "close_tab"},
    {"text": "close the tab", "intent": "close_tab"},
    {"text": "get rid of this tab", "intent": "close_tab"},
    {"text": "dismiss tab", "intent": "close_tab"},
    {"text": "close the current tab", "intent": "close_tab"},
    
    # Go back - add 8 more examples
    {"text": "previous page", "intent": "go_back"},
    {"text": "back please", "intent": "go_back"},
    {"text": "return to previous", "intent": "go_back"},
    {"text": "navigate back", "intent": "go_back"},
    {"text": "go to previous page", "intent": "go_back"},
    {"text": "take me back", "intent": "go_back"},
    {"text": "back button", "intent": "go_back"},
    {"text": "go backwards", "intent": "go_back"},
    
    # Go forward - add 9 more examples
    {"text": "next page", "intent": "go_forward"},
    {"text": "forward please", "intent": "go_forward"},
    {"text": "move forward", "intent": "go_forward"},
    {"text": "navigate forward", "intent": "go_forward"},
    {"text": "go to next page", "intent": "go_forward"},
    {"text": "advance", "intent": "go_forward"},
    {"text": "forward button", "intent": "go_forward"},
    {"text": "go forwards", "intent": "go_forward"},
    {"text": "continue forward", "intent": "go_forward"},
    
    # Reload - add 8 more examples
    {"text": "refresh the page", "intent": "reload"},
    {"text": "reload this", "intent": "reload"},
    {"text": "update page", "intent": "reload"},
    {"text": "reload current page", "intent": "reload"},
    {"text": "refresh this page", "intent": "reload"},
    {"text": "reload the website", "intent": "reload"},
    {"text": "hit refresh", "intent": "reload"},
    {"text": "refresh browser", "intent": "reload"},
    
    # Click - add 8 more examples
    {"text": "click that button", "intent": "click"},
    {"text": "press the link", "intent": "click"},
    {"text": "tap on that", "intent": "click"},
    {"text": "select the button", "intent": "click"},
    {"text": "click on the menu", "intent": "click"},
    {"text": "press that option", "intent": "click"},
    {"text": "hit the submit button", "intent": "click"},
    {"text": "click the download link", "intent": "click"},
    
    # Type - add 8 more examples
    {"text": "enter my email", "intent": "type"},
    {"text": "type in the search box", "intent": "type"},
    {"text": "input my password", "intent": "type"},
    {"text": "write something in the field", "intent": "type"},
    {"text": "fill in the form", "intent": "type"},
    {"text": "type my username", "intent": "type"},
    {"text": "enter text here", "intent": "type"},
    {"text": "input data into field", "intent": "type"},
]

# Combine with existing data
all_data = existing_data + new_examples

# Remove duplicates based on text (case-insensitive)
seen_texts = set()
unique_data = []
for item in all_data:
    text_lower = item['text'].lower()
    if text_lower not in seen_texts:
        seen_texts.add(text_lower)
        unique_data.append(item)

# Save expanded data
with open('training_data_expanded.json', 'w') as f:
    json.dump(unique_data, f, indent=2)

print(f"\n✓ Training data further expanded:")
print(f"  Previous examples: {len(existing_data)}")
print(f"  New examples added: {len(new_examples)}")
print(f"  Total unique examples: {len(unique_data)}")

# Show distribution
from collections import Counter
intent_counts = Counter(item['intent'] for item in unique_data)
print(f"\nExamples per intent:")
for intent, count in sorted(intent_counts.items()):
    print(f"  {intent:12}: {count:3}")

print(f"\n✓ Saved to: training_data_expanded.json")
