from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routers import chat

load_dotenv()

app = FastAPI(
    title="chatbot-fp API",
    description="API REST para el chatbot chatbot-fp",
    version="0.1.0",
)

# CORS — en producción reemplaza "*" por el dominio real del frontend
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
