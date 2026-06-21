# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ComplaintRequest(BaseModel):
    text: str

class ComplaintResponse(BaseModel):
    sentiment: str
    score: float
    priority: str

@router.post("/analyze", response_model=ComplaintResponse)
def analyze_complaint(request: ComplaintRequest):
    # Mocking DistilBERT behavior due to PyTorch Windows DLL load issues
    text = request.text.lower()
    
    if "angry" in text or "terrible" in text or "issue" in text or "complaint" in text or "broken" in text:
        sentiment = "NEGATIVE"
        score = 0.95
    else:
        sentiment = "POSITIVE"
        score = 0.88
    
    # If the sentiment is negative, flag as CRITICAL
    priority = "CRITICAL" if sentiment == "NEGATIVE" else "NORMAL"
    
    return ComplaintResponse(
        sentiment=sentiment,
        score=score,
        priority=priority
    )
