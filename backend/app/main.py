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
from app.routes import sentiment, ocr, chatbot, health, summarizer

app = FastAPI(title="KFintech Nexus Portal AI Models API")

# Include the routers
app.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment"])
app.include_router(ocr.router, prefix="/ocr", tags=["OCR Verification"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["RAG Chatbot"])
app.include_router(summarizer.router, prefix="/summarize", tags=["Summarizer"])
app.include_router(health.router, prefix="/health", tags=["Health"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the KFintech Nexus Portal AI Models API. Use /docs to view the API documentation."}
