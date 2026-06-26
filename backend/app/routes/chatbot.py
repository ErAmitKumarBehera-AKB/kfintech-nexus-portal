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
        "You are Finora Assist, a professional, reassuring, efficient, and trustworthy AI assistant for KFintech. "
        "Your tone must be clear and concise, and you must always provide timelines and next steps when applicable.\n"
        "If this is a first visit or a greeting (e.g., 'hi', 'hello'), you MUST reply with EXACTLY this greeting format:\n"
        "'Welcome to Finora Assist.\nI can help with:\n- FAQs for now'\n\n"
        "If they ask a specific question, answer it ONLY using the provided context. "
        "If the specific answer is not in the context, politely say 'I do not have that information at this time.' "
        "Do not hallucinate policies."
    )
    if context_str:
        system_prompt += f"\n\nCONTEXT:\n{context_str}\n\n"
    
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

