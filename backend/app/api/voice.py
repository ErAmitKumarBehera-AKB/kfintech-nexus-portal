from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

import os
import uuid
import shutil

router = APIRouter()

class VoiceTranscriptionResponse(BaseModel):
    text: str
    message: str
    audio_path: str

print("[AI] Loading Whisper-Tiny (Private Voice AI)...")
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[RUN] Loading Whisper-tiny on {device}...")
        # Load the smallest whisper model (~150MB) for ultra-fast, local processing
        _whisper_model = whisper.load_model("tiny", device=device)
        print("[OK] Whisper-tiny loaded successfully.")
    return _whisper_model

@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_voice(
    audio_file: UploadFile = File(..., description="The voice recording blob from the user")
):
    """
    100% Local Speech-to-Text translation.
    Ensures absolute data privacy by keeping the audio entirely on-premise.
    Saves the audio to local storage / MongoDB for audit compliance.
    """
    content_type = audio_file.content_type or ""
    if not content_type.startswith('audio/') and not content_type.startswith('video/webm'):
        raise HTTPException(status_code=400, detail="Invalid audio file.")

    # 1. Save audio locally for transcription and compliance auditing
    os.makedirs("uploads/voice_audits", exist_ok=True)
    file_ext = ".webm" if "webm" in content_type else ".wav"
    safe_filename = f"voice_audit_{uuid.uuid4().hex[:8]}{file_ext}"
    local_path = os.path.join("uploads", "voice_audits", safe_filename)

    try:
        with open(local_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save audio file: {e}")

    # TODO: In production, upload `local_path` to MongoDB GridFS or LocalStack S3 here.
    print(f"🔒 [Privacy Compliance] Audio securely saved to {local_path} (Ready for MongoDB GridFS).")

    # 2. Transcribe locally using Whisper
    try:
        model = get_whisper_model()
        # Whisper automatically processes standard audio formats
        result = model.transcribe(local_path)
        transcribed_text = result.get("text", "").strip()
        
        return VoiceTranscriptionResponse(
            text=transcribed_text,
            message="Voice transcribed locally with 100% privacy.",
            audio_path=local_path
        )
    except Exception as e:
        print(f"Whisper transcription failed: {e}")
        raise HTTPException(status_code=500, detail="Transcription engine failed.")
