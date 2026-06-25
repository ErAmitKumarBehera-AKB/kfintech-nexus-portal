# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
import json
import re
import torch

router = APIRouter()

# ─────────────────────────────────────────────────────────────
# Load Llama-3.2-3B-Instruct GGUF once at startup
# ─────────────────────────────────────────────────────────────
print("🤖 Loading Mock AI Response Engine...")
_model = None

def get_model():
    pass

def load_llm():
    pass

# ─────────────────────────────────────────────────────────────
# RAG Setup: Load ChromaDB
# ─────────────────────────────────────────────────────────────
_vector_store = None

def get_retriever():
    global _vector_store
    if _vector_store is None:
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            from langchain_community.vectorstores import Chroma
            print("📚 Connecting to ChromaDB RAG Vector Store...")
            embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            _vector_store = Chroma(persist_directory="chroma_db", embedding_function=embeddings)
            print("✅ ChromaDB Connected.")
        except Exception as e:
            print(f"⚠️ ChromaDB Error: {e}")
    return _vector_store


def run_inference(messages: list, max_new_tokens: int = 256) -> str:
    """Mock inference."""
    try:
        # We just return a mock response for UI testing to avoid the 1.8GB docker crash
        user_message = messages[-1]["content"] if messages else ""
        return f"Hello! This is a mock response from the backend. You said: '{user_message}'. We temporarily disabled the heavy Llama AI model to bypass the Docker crash, so you can test the Voice UI instantly!"
    except Exception as e:
        print(f"Inference error: {e}")
        return "I'm sorry, I encountered an error."


# ─────────────────────────────────────────────────────────────
# Request / Response schemas
# ─────────────────────────────────────────────────────────────
class SummarizeRequest(BaseModel):
    text: str

class SummarizeResponse(BaseModel):
    bullets: list[str]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str


# ─────────────────────────────────────────────────────────────
# POST /summarize/analyze  ← replaces Ollama chatbot/ask
# ─────────────────────────────────────────────────────────────
@router.post("/analyze", response_model=SummarizeResponse)
def analyze_complaint(request: SummarizeRequest):
    """
    Summarize a financial investor complaint into exactly 3 bullet points.
    Returns clean JSON - no regex or cleanup needed.
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a senior financial complaint analyst at KFintech. "
                "When given an investor complaint, you MUST output ONLY a valid JSON object "
                'with a single key "bullets" containing exactly 3 short, actionable strings. '
                'Example: {"bullets": ["Issue identified", "Root cause found", "Action required"]}. '
                "Do NOT include any other text, explanation, or markdown."
            )
        },
        {
            "role": "user",
            "content": f"Summarize this investor complaint into exactly 3 bullet points:\n\n{request.text}"
        }
    ]

    try:
        raw = run_inference(messages, max_new_tokens=200)

        # Try to parse JSON directly (Qwen usually outputs clean JSON)
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            bullets = parsed.get("bullets", [])
            if isinstance(bullets, list) and len(bullets) >= 3:
                return SummarizeResponse(bullets=bullets[:3])

        # Fallback: split by newlines or commas if JSON parse fails
        lines = [l.strip().lstrip("•-–*123. ") for l in raw.split('\n') if len(l.strip()) > 10]
        if len(lines) >= 3:
            return SummarizeResponse(bullets=lines[:3])

    except Exception as e:
        print(f"Qwen summarization error: {e}")

    # Safe fallback
    return SummarizeResponse(bullets=[
        "Investor complaint received and logged.",
        "AI analysis flagged potential priority issue.",
        "Manual review recommended by compliance team."
    ])


# ─────────────────────────────────────────────────────────────
# POST /summarize/chat  ← replaces Ollama for ChatbotWidget
# ─────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest):
    """
    General chatbot endpoint for investor queries using Qwen2.5-1.5B.
    Replaces the Ollama proxy completely.
    """
    # Perform RAG Retrieval
    context = ""
    vs = get_retriever()
    if vs:
        try:
            docs = vs.similarity_search(request.message, k=2)
            context_texts = [d.page_content for d in docs]
            context = "\n".join(context_texts)
        except Exception as e:
            print(f"RAG Retrieval failed: {e}")

    system_prompt = (
        "You are a helpful AI assistant for KFintech Nexus Portal — a financial services platform. "
        "Help investors with queries about mutual funds, SIP, NAV, KYC, folio numbers, grievances, and SLA timelines. "
        "Be concise, professional, and accurate. Do not make up information. Use the 'Thinking Mode' to verify your answer.\n"
    )
    
    if context:
        system_prompt += f"\nRelevant KFintech Policies/Knowledge:\n{context}\n\nUse this knowledge to answer accurately."

    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": request.message
        }
    ]

    try:
        response_text = run_inference(messages, max_new_tokens=300)
        return ChatResponse(response=response_text)
    except Exception as e:
        print(f"Qwen chat error: {e}")
        return ChatResponse(
            response="I'm sorry, the AI engine is initialising. Please try again in a moment."
        )
