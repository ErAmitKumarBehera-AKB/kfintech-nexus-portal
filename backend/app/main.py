import os
import platform
import ctypes
from importlib.util import find_spec
from dotenv import load_dotenv

load_dotenv()

# Fix PyTorch DLL loading issue on Windows
if platform.system() == "Windows":
    try:
        if (spec := find_spec("torch")) and spec.origin and os.path.exists(
            dll_path := os.path.join(os.path.dirname(spec.origin), "lib", "c10.dll")
        ):
            ctypes.CDLL(os.path.normpath(dll_path))
    except Exception:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import sentiment, ocr, chatbot, health, summarizer

app = FastAPI(
    title="FinnovaX AI Engine",
    description="OCR, Sentiment Analysis, RAG Chatbot & Summarization API",
    version="1.0.0"
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow Node.js backend(s) to call this service.
# Set ALLOWED_ORIGINS env var in production (comma-separated).
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5000,http://127.0.0.1:5000"
)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(sentiment.router,  prefix="/sentiment",  tags=["Sentiment"])
app.include_router(ocr.router,        prefix="/ocr",        tags=["OCR Verification"])
app.include_router(chatbot.router,    prefix="/chatbot",    tags=["RAG Chatbot"])
app.include_router(summarizer.router, prefix="/summarize",  tags=["Summarizer"])
app.include_router(health.router,     prefix="/health",     tags=["Health"])

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Auto-seed the ChromaDB knowledge base on every startup if empty."""
    try:
        from app.services.knowledge_base import seed_faqs
        seed_faqs()
        print("✅ ChromaDB FAQ knowledge base ready.")
    except Exception as e:
        print(f"⚠️  ChromaDB seeding failed (non-critical): {e}")

@app.get("/")
def read_root():
    return {
        "service": "FinnovaX AI Engine",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }
