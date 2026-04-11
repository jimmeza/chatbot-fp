import type { ChatMessage } from "../types";

/**
 * Convierte URLs planas en texto a enlaces HTML que abren en pestaña nueva.
 */
function linkifyText(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  return text.replace(
    urlRegex,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
}

/**
 * Construye y gestiona el área de mensajes del chat.
 */
export class ChatWindow {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Agrega un mensaje al final de la conversación y hace scroll hacia él.
   */
  appendMessage(message: ChatMessage): void {
    const bubble = document.createElement("div");
    bubble.classList.add("message", `message--${message.role}`);

    const content = document.createElement("div");
    content.classList.add("message__content");
    content.innerHTML = linkifyText(message.text);

    bubble.appendChild(content);
    this.container.appendChild(bubble);
    this.scrollToBottom();
  }

  /**
   * Muestra un indicador de "escribiendo..." mientras espera la respuesta.
   * Devuelve una función para eliminarlo.
   */
  showTypingIndicator(): () => void {
    const indicator = document.createElement("div");
    indicator.classList.add("message", "message--bot", "message--typing");
    indicator.id = "typing-indicator";
    indicator.innerHTML = `<div class="message__content"><span></span><span></span><span></span></div>`;
    this.container.appendChild(indicator);
    this.scrollToBottom();
    return () => indicator.remove();
  }

  private scrollToBottom(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }

  clear(): void {
    this.container.innerHTML = "";
  }
}
