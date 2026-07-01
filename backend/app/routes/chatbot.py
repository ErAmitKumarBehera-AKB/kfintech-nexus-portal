from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_service import query_context
from app.services.llm_service import query_llm

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(request: ChatRequest):
    # 1. Retrieval
    context_str, sources = query_context(request.question)
    
    # No ticket context for now, keep it strictly FAQ RAG-based.
    
    # 4. Prompt Construction
    system_prompt = (
        "You are Finora, the intelligent AI assistant for FinnovaX — a modern, secure investor services platform by KFintech. "
        "Your tone is professional, warm, and reassuring. Always be concise and helpful.\n\n"
        "GREETING RULE: If this appears to be a first message or a greeting (e.g. 'hi', 'hello', 'hey', 'start'), "
        "respond with EXACTLY this and nothing else:\n"
        "'Welcome to FinnovaX! 👋\n\nI'm Finora, your personal investment services assistant.\n\n"
        "I can help you with:\n"
        "• Understanding your KYC or profile status\n"
        "• Ticket submissions and service requests\n"
        "• Bank account, nominee, or address update queries\n"
        "• General platform FAQs\n\n"
        "What can I help you with today?'\n\n"
        "For all other questions: answer ONLY using the provided context. "
        "If the answer is not in the context, say 'I don't have that information right now, but our support team is here to help.' "
        "Never hallucinate policies or invent information."
    )
    if context_str:
        system_prompt += f"\n\nKNOWLEDGE BASE CONTEXT:\n{context_str}\n"

    
    history_str = ""
    if request.history:
        history_str = "CHAT HISTORY:\n"
        # Only process last 4 messages to save tokens
        for msg in request.history[-4:]:
            history_str += f"{'User' if msg['type'] == 'user' else 'Finora Assist'}: {msg['text']}\n"
    
    full_prompt = f"{system_prompt}\n{history_str}\nUser: {request.question}\nFinora Assist:"
    
    # 5. LLM Call
    llm_response = await query_llm(full_prompt)
    
    return ChatResponse(
        query=request.question,
        response=llm_response,
        retrieved_data_source=sources,
        sentiment="NEUTRAL",
        fraud_alert=False
    )

