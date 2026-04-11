from app.models.chat import ChatRequest, ChatResponse


def process_message(request: ChatRequest) -> ChatResponse:
    """
    Stub de lógica de chat. Reemplazar con integración a un LLM real.
    Por ejemplo: OpenAI, Azure OpenAI, Ollama, etc.
    """
    user_message = request.message.strip()

    # --- Aquí va la integración al LLM ---
    # Ejemplo con OpenAI:
    # from openai import OpenAI
    # client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    # completion = client.chat.completions.create(
    #     model="gpt-4o",
    #     messages=[{"role": "user", "content": user_message}]
    # )
    # respuesta = completion.choices[0].message.content

    respuesta = (
        f"Recibí tu mensaje: '{user_message}'. "
        "Este es un stub. Conecta un LLM en chat_service.py para respuestas reales. "
        "Más info en https://platform.openai.com/docs"
    )

    return ChatResponse(respuesta=respuesta)
