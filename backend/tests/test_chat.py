import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_chat_returns_respuesta():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/api/chat/", json={"message": "Hola"})
    assert response.status_code == 200
    data = response.json()
    assert "respuesta" in data
    assert isinstance(data["respuesta"], str)
    assert len(data["respuesta"]) > 0


@pytest.mark.asyncio
async def test_chat_empty_message():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/api/chat/", json={"message": ""})
    assert response.status_code == 200
    assert "respuesta" in response.json()


@pytest.mark.asyncio
async def test_chat_missing_field():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/api/chat/", json={})
    assert response.status_code == 422  # Validation error
