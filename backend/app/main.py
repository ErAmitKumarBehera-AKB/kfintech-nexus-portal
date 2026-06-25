import os
import platform
import ctypes
from importlib.util import find_spec

# Fix PyTorch DLL loading issue on Windows
if platform.system() == "Windows":
    try:
        if (spec := find_spec("torch")) and spec.origin and os.path.exists(
            dll_path := os.path.join(os.path.dirname(spec.origin), "lib", "c10.dll")
        ):
            ctypes.CDLL(os.path.normpath(dll_path))
    except Exception:
        pass
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from .api import sentiment
from .api import ocr
from .api import summarize
from .api import voice

app = FastAPI(title="KFintech Nexus Portal AI Models API")

# Include the routers
app.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment"])
app.include_router(ocr.router, prefix="/ocr", tags=["OCR Verification"])
app.include_router(summarize.router, prefix="/summarize", tags=["Summarize & AI Chat"])
app.include_router(voice.router, prefix="/voice", tags=["Private Voice AI"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the KFintech Nexus Portal AI Models API"}
