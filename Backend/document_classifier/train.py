import os, sys
import re
import nltk
import pickle
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from text_preprocessor import TextPreprocessor

nltk.download('punkt_tab')
nltk.download('stopwords')
nltk.download('wordnet')

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(BASE_DIR, "../dataset")
dataset_path = os.path.abspath(dataset_path)

model_path = "knn_text_classifier.pkl"

def load_data_from_folders(base_path):
    texts, labels = [], []
    for label_folder in os.listdir(base_path):
        folder_path = os.path.join(base_path, label_folder)
        if os.path.isdir(folder_path):
            for filename in os.listdir(folder_path):
                if filename.endswith(".txt"):
                    with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as f:
                        texts.append(f.read())
                        labels.append(label_folder)
    return texts, labels

# Load and split data
texts, labels = load_data_from_folders(dataset_path)
X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.25, random_state=42)

# Create pipeline
pipeline = Pipeline([
    ('preprocess', TextPreprocessor()),
    ('vectorizer', TfidfVectorizer()),
    ('classifier', KNeighborsClassifier(n_neighbors=3))
])

# Train model
pipeline.fit(X_train, y_train)

# Evaluate
predictions = pipeline.predict(X_test)
print("\nClassification Report:\n")
print(classification_report(y_test, predictions))

# Save model
with open(model_path, "wb") as f:
    pickle.dump(pipeline, f)
print(f"✅ Model saved to: {model_path}")
