# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

router = APIRouter()

class ComplaintRequest(BaseModel):
    text: str

class ComplaintResponse(BaseModel):
    sentiment: str
    score: float
    priority: str

import torch
from transformers import pipeline

# Load pipeline globally to avoid reloading on every request
try:
    # Upgraded to Industry-Standard Financial Model
    sentiment_analyzer = pipeline("sentiment-analysis", model="ProsusAI/finbert")
except Exception as e:
    sentiment_analyzer = None
    print(f"Failed to load transformer model: {e}")

@router.post("/analyze", response_model=ComplaintResponse)
def analyze_complaint(request: ComplaintRequest):
    text = request.text
    
    if sentiment_analyzer:
        # FinBERT Returns [{'label': 'positive'/'negative'/'neutral', 'score': 0.99}]
        result = sentiment_analyzer(text)[0]
        label = result['label'].upper()
        confidence = result['score']
        
        # Calculate Frustration Index
        if label == "NEGATIVE":
            score = confidence
            sentiment = "NEGATIVE"
        elif label == "POSITIVE":
            score = 1.0 - confidence
            sentiment = "POSITIVE"
        else:
            # NEUTRAL
            score = 0.5
            sentiment = "NEUTRAL"
            
        score = round(score, 4)
    else:
        # Fallback if model fails to load
        sentiment = "NEGATIVE" if "angry" in text.lower() or "terrible" in text.lower() else "POSITIVE"
        score = 0.9 if sentiment == "NEGATIVE" else 0.1
        
    priority = "CRITICAL" if score > 0.75 else "NORMAL"
    
    return ComplaintResponse(
        sentiment=sentiment,
        score=score,
        priority=priority
    )
