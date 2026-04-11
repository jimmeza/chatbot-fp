import type { ChatRequest, ChatResponse } from "../types";

const BASE = "/api";

/**
 * Envía un mensaje al backend y devuelve la respuesta del chatbot.
 */
export async function sendMessage(message: string): Promise<ChatResponse> {
  const body: ChatRequest = { message };

  const response = await fetch(`${BASE}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<ChatResponse>;
}
