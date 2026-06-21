# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    query: str
    response: str
    retrieved_data_source: list[str]

@router.post("/ask", response_model=ChatResponse)
def ask_chatbot(request: ChatRequest):
    # Mocking LangChain/Ollama behavior due to missing dependencies/DLL load issues
    return ChatResponse(
        query=request.question,
        response="Based on KFintech compliance policy, you must submit a formal request with a valid scanned ID.",
        retrieved_data_source=[
            "KFintech Internal Policy v2.1: Verification of Identity requires valid government ID scanning for all mutual fund transactions over $10,000."
        ]
    )
