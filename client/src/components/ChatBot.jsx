import { useEffect, useRef, useState } from "react";
import botLogo from "./image.jpeg";
import "../css/ChatBot.css";

const BACKEND_ORIGIN = String(import.meta.env.VITE_BACKEND_ORIGIN || "").trim();
const DEFAULT_LOCAL_BACKEND_ORIGIN = "http://localhost:8787";

function buildChatEndpoints() {
  const endpoints = ["/api/chat", `${DEFAULT_LOCAL_BACKEND_ORIGIN}/api/chat`];

  if (BACKEND_ORIGIN) {
    const normalizedOrigin = BACKEND_ORIGIN.replace(/\/+$/, "");
    endpoints.push(`${normalizedOrigin}/api/chat`);
  }

  return [...new Set(endpoints)];
}

const CHAT_ENDPOINTS = buildChatEndpoints();

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I am ready. Ask me anything." },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const userMessage = { role: "user", content: prompt };
    const history = [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const payload = await requestChatReply(history);
      const reply = String(payload?.reply || "").trim();
      if (!reply) {
        throw new Error("Server returned an empty response.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message ||
            "Unable to connect to backend chat API. Make sure your backend server is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function requestChatReply(history) {
    let lastError = null;

    for (const endpoint of CHAT_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const statusError = new Error(
            payload?.error ||
              payload?.message ||
              `Request failed with status ${response.status}`,
          );

          if (response.status === 404) {
            lastError = statusError;
            continue;
          }

          throw statusError;
        }

        return payload;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Unable to connect to backend chat API.");
  }

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <strong>Law Assistant</strong>
            <button
              type="button"
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chatbot-message ${
                  message.role === "user" ? "user-message" : "assistant-message"
                }`}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message assistant-message">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chatbot-form">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Type your message..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chatbot-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Open chatbot"
      >
        <img
          src={botLogo}
          alt=""
          aria-hidden="true"
          className="chatbot-toggle-img"
        />
      </button>
    </div>
  );
}

export default ChatBot;
