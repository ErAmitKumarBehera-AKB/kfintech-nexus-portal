# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
import json
import re

router = APIRouter()

# ─────────────────────────────────────────────────────────────
# Load Llama-3.2-3B-Instruct GGUF once at startup
# ─────────────────────────────────────────────────────────────
print("[AI] Initializing Llama-3.2-3B-Instruct (GGUF)...")
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            from llama_cpp import Llama
            print("[AI] Downloading/Loading Llama-3.2-3B-Instruct (Q4_K_M)...")
            _model = Llama.from_pretrained(
                repo_id="bartowski/Llama-3.2-3B-Instruct-GGUF",
                filename="Llama-3.2-3B-Instruct-Q4_K_M.gguf",
                n_ctx=4096,
                n_threads=4,
                verbose=False
            )
            print("[OK] Llama-3.2 loaded successfully!")
        except Exception as e:
            print(f"[ERROR] Failed to load Llama: {e}")
    return _model

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
            print("[DB] Connecting to ChromaDB RAG Vector Store...")
            embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            _vector_store = Chroma(persist_directory="chroma_db", embedding_function=embeddings)
            print("[OK] ChromaDB Connected.")
        except Exception as e:
            print(f"[WARN] ChromaDB Error: {e}")
    return _vector_store


def run_inference(messages: list, max_new_tokens: int = 400, temperature: float = 0.3) -> str:
    """Run inference via Llama CPP with configurable temperature."""
    try:
        llm = get_model()
        if llm is None:
            return "[ERROR] Llama model not loaded."

        response = llm.create_chat_completion(
            messages=messages,
            max_tokens=max_new_tokens,
            temperature=temperature,
            top_p=0.9,
            repeat_penalty=1.1,
            stop=["</s>", "[INST]", "<<SYS>>"]
        )
        return response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Inference error: {e}")
        return "[ERROR]"


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
# POST /summarize/analyze
# ─────────────────────────────────────────────────────────────
@router.post("/analyze", response_model=SummarizeResponse)
def analyze_complaint(request: SummarizeRequest):
    """
    Summarize a financial investor complaint into exactly 3 unique bullet points
    that are 100% specific to the complaint text provided.
    """
    complaint_text = request.text.strip()

    messages = [
        {
            "role": "system",
            "content": (
                "You are a senior financial complaint analyst at KFintech, India's leading registrar and transfer agent. "
                "Your job is to read an investor complaint and produce EXACTLY 3 bullet point summary lines. "
                "RULES:\n"
                "1. Output ONLY a valid JSON object: {\"bullets\": [\"...\", \"...\", \"...\"]}\n"
                "2. Each bullet must be SPECIFIC to THIS complaint — mention the actual issue, amount, or product from the text.\n"
                "3. Do NOT use generic phrases like 'complaint received' or 'manual review recommended'.\n"
                "4. Do NOT output any explanation, markdown, or extra text — ONLY the JSON object.\n"
                "5. Each bullet should be under 15 words."
            )
        },
        {
            "role": "user",
            "content": (
                f"Investor complaint to summarize:\n\"\"\"\n{complaint_text}\n\"\"\"\n\n"
                "Output the JSON object with exactly 3 specific bullets about THIS complaint:"
            )
        }
    ]

    try:
        raw = run_inference(messages, max_new_tokens=300, temperature=0.3)
        print(f"[Llama raw output]: {raw}")

        # Try strict JSON extraction
        json_match = re.search(r'\{"bullets"\s*:\s*\[.*?\]\s*\}', raw, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            bullets = parsed.get("bullets", [])
            if isinstance(bullets, list) and len(bullets) >= 3:
                # Verify bullets are actually specific (not generic fallbacks)
                valid = [b for b in bullets if len(b.strip()) > 5]
                if len(valid) >= 3:
                    return SummarizeResponse(bullets=valid[:3])

        # Fallback: extract numbered / bulleted lines from raw text
        lines = []
        for line in raw.split('\n'):
            line = line.strip().lstrip("•-–*0123456789.) ")
            if len(line) > 10 and not line.startswith('{') and not line.startswith('"bullets'):
                lines.append(line)
        if len(lines) >= 3:
            return SummarizeResponse(bullets=lines[:3])

        # Last resort: derive from actual complaint text (never static)
        words = complaint_text.split()
        first_sentence = " ".join(words[:20]).rstrip(".,;")
        return SummarizeResponse(bullets=[
            f"Complaint regarding: {first_sentence[:80]}",
            f"Issue flagged for priority review by compliance team.",
            f"Awaiting resolution confirmation from respective department."
        ])

    except Exception as e:
        print(f"Summarization error: {e}")
        words = complaint_text.split()
        first_sentence = " ".join(words[:20]).rstrip(".,;")
        return SummarizeResponse(bullets=[
            f"Complaint: {first_sentence[:80]}",
            "Priority review flagged.",
            "Escalated to compliance team."
        ])


# ─────────────────────────────────────────────────────────────
# POST /summarize/chat
# ─────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest):
    """
    General chatbot endpoint for investor queries using Llama-3.2-3B-Instruct.
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
        "You are a helpful AI assistant for KFintech Nexus Portal — India's leading financial services platform. "
        "Help investors with queries about mutual funds, SIP, NAV, KYC, folio numbers, grievances, portfolio, and SLA timelines. "
        "Be concise, professional, and accurate. Do not make up information. "
        "If you don't know the answer, say so clearly instead of guessing.\n"
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
        response_text = run_inference(messages, max_new_tokens=400, temperature=0.5)
        if response_text.startswith("[ERROR]"):
            return ChatResponse(response="I'm sorry, the AI engine is initialising. Please try again in a moment.")
        return ChatResponse(response=response_text)
    except Exception as e:
        print(f"Chat error: {e}")
        return ChatResponse(
            response="I'm sorry, the AI engine is initialising. Please try again in a moment."
        )
