from fastapi import APIRouter
from app.models.schemas import SummarizeRequest, SummarizeResponse
from app.services.llm_service import summarize_ticket

router = APIRouter()

@router.post("/ticket", response_model=SummarizeResponse)
async def summarize_ticket_data(request: SummarizeRequest):
    ticket_data_str = str(request.ticket_data)
    bullets = await summarize_ticket(ticket_data_str)
    return SummarizeResponse(summary=bullets)
