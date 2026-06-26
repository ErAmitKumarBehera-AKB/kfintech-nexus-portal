from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def health_check():
    return {
        "status": "healthy", 
        "service": "Finora Assist",
        "version":"1.0"
        }
