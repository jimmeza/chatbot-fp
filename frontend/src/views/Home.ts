import { ChatWindow } from "../components/ChatWindow";
import { sendMessage } from "../api/client";

export function renderHome(appRoot: HTMLElement): void {
  appRoot.innerHTML = `
    <div class="chat-layout">
      <header class="chat-header">
        <h1>chatbot-fp</h1>
      </header>

      <div class="chat-messages" id="chat-messages"></div>

      <form class="chat-form" id="chat-form">
        <input
          type="text"
          id="chat-input"
          class="chat-input"
          placeholder="Escribe un mensaje..."
          autocomplete="off"
          autofocus
        />
        <button type="submit" class="chat-submit" id="chat-submit">Enviar</button>
      </form>
    </div>
  `;

  const messagesContainer = document.getElementById("chat-messages") as HTMLElement;
  const form = document.getElementById("chat-form") as HTMLFormElement;
  const input = document.getElementById("chat-input") as HTMLInputElement;
  const submitBtn = document.getElementById("chat-submit") as HTMLButtonElement;

  const chatWindow = new ChatWindow(messagesContainer);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    // Muestra el mensaje del usuario
    chatWindow.appendMessage({ role: "user", text });
    input.value = "";
    input.disabled = true;
    submitBtn.disabled = true;

    // Indicador de escritura
    const removeTyping = chatWindow.showTypingIndicator();

    try {
      const response = await sendMessage(text);
      removeTyping();
      chatWindow.appendMessage({ role: "bot", text: response.respuesta });
    } catch (error) {
      removeTyping();
      const message = error instanceof Error ? error.message : "Error desconocido";
      chatWindow.appendMessage({
        role: "bot",
        text: `No se pudo obtener respuesta: ${message}`,
      });
    } finally {
      input.disabled = false;
      submitBtn.disabled = false;
      input.focus();
    }
  });
}
