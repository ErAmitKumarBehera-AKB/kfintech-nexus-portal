from fastapi import APIRouter
from app.models.schemas import ComplaintRequest, ComplaintResponse
from app.services.sentiment_service import analyze_complaint_text

router = APIRouter()

@router.post("/analyze", response_model=ComplaintResponse)
def analyze_complaint(request: ComplaintRequest):
    sentiment, score, priority, fraud_alert, intent = analyze_complaint_text(request.text)
    
    return ComplaintResponse(
        sentiment=sentiment,
        score=score,
        priority=priority,
        intent=intent,
        fraud_alert=fraud_alert
    )
