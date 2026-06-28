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
    fraud_alert: bool = False

# Load pipeline globally to avoid reloading on every request
try:
    import torch
    from transformers import pipeline
    device = 0 if torch.cuda.is_available() else -1
    # Upgraded to Industry-Standard Financial Model
    sentiment_analyzer = pipeline("sentiment-analysis", model="ProsusAI/finbert", device=device)
except Exception as e:
    sentiment_analyzer = None
    print(f"Failed to load transformer model: {e}")

@router.post("/analyze", response_model=ComplaintResponse)
def analyze_complaint(request: ComplaintRequest):
    text = request.text
    
    fraud_keywords = ["scam", "fraud", "hacked", "stolen", "unauthorized", "theft"]
    fraud_alert = any(keyword in text.lower() for keyword in fraud_keywords)
    
    severe_keywords = ["lawyer", "sue", "legal", "unacceptable", "fbi", "police", "court", "urgent", "ombudsman", "disgusting", "terrible"]
    
    if sentiment_analyzer:
        # FinBERT Returns [{'label': 'positive'/'negative'/'neutral', 'score': 0.99}]
        result = sentiment_analyzer(text)[0]
        label = result['label'].upper()
        confidence = result['score']
        
        # Calculate Frustration Index
        if label == "NEGATIVE":
            score = confidence
            # Apply frustration multiplier for severe keywords or fraud
            if any(keyword in text.lower() for keyword in severe_keywords) or fraud_alert:
                score = min(1.0, score + 0.3)
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
        negative_count = sum(1 for keyword in severe_keywords if keyword in text.lower())
        if fraud_alert:
            negative_count += 2
            
        if negative_count > 0:
            sentiment = "NEGATIVE"
            score = min(1.0, 0.7 + (negative_count * 0.1))
        else:
            sentiment = "POSITIVE"
            score = 0.1
        
    priority = "CRITICAL" if score > 0.75 or fraud_alert else "NORMAL"
    
    return ComplaintResponse(
        sentiment=sentiment,
        score=score,
        priority=priority,
        fraud_alert=fraud_alert
    )
