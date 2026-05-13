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
    const assistantIndex = messages.length + 1;
    const history = [...messages, userMessage];

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "" },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      await requestChatReplyStream(history, assistantIndex);
    } catch (error) {
      setMessages((prev) => {
        const next = [...prev];
        if (next[assistantIndex]) {
          next[assistantIndex] = {
            ...next[assistantIndex],
            content:
              error.message ||
              "Unable to connect to backend chat API. Make sure your backend server is running.",
          };
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function requestChatReplyStream(history, assistantIndex) {
    let lastError = null;

    for (const endpoint of CHAT_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            messages: history.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => null);
          const statusError = new Error(
            errorText || `Request failed with status ${response.status}`,
          );

          if (response.status === 404) {
            lastError = statusError;
            continue;
          }

          throw statusError;
        }

        if (!response.body) {
          throw new Error("Backend did not return a streaming response.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop();

          for (const line of lines) {
            const chunk = parseStreamLine(line);
            if (chunk) {
              appendAssistantChunk(chunk, assistantIndex);
            }
          }
        }

        if (buffer.trim()) {
          const chunk = parseStreamLine(buffer);
          if (chunk) {
            appendAssistantChunk(chunk, assistantIndex);
          }
        }

        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Unable to connect to backend chat API.");
  }

  function appendAssistantChunk(chunk, assistantIndex) {
    setMessages((prev) => {
      const next = [...prev];
      if (!next[assistantIndex]) return prev;
      next[assistantIndex] = {
        ...next[assistantIndex],
        content: next[assistantIndex].content + chunk,
      };
      return next;
    });
  }

  function parseStreamLine(line) {
    const trimmed = String(line).trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("data:")) {
      return trimmed.slice(5).trim();
    }
    return trimmed;
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
