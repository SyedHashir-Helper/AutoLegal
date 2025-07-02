import pickle, os, sklearn
from text_preprocessor import TextPreprocessor

# Build absolute path to model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../knn_text_classifier.pkl")


# Load model once
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# Function to classify a raw document
def predict_document_type(text: str) -> str:
    prediction = model.predict([text])[0]
    return prediction
