export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  respuesta: string;
}

export type MessageRole = "user" | "bot";

export interface ChatMessage {
  role: MessageRole;
  text: string;
}
