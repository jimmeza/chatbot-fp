from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import process_message

router = APIRouter()


@router.post("/api/chat/", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Recibe un mensaje del usuario y devuelve la respuesta del chatbot.
    """
    return process_message(request)
