import { useEffect, useRef, useState } from "react";

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
    <div
      style={{
        position: "absolute",
        right: "24px",
        bottom: "24px",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "12px",
      }}
    >
      {isOpen && (
        <div
          className="bg-white shadow"
          style={{
            width: "min(92vw, 360px)",
            borderRadius: "14px",
            border: "1px solid rgba(22, 48, 87, 0.2)",
            overflow: "hidden",
          }}
        >
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2 text-white"
            style={{
              background: "linear-gradient(135deg, #1f3b73 0%, #2f6ea5 100%)",
            }}
          >
            <strong>Chat Assistant</strong>
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>

          <div
            className="p-3 d-flex flex-column gap-2"
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              backgroundColor: "#f8fbff",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`px-3 py-2 rounded-3 ${
                  message.role === "user"
                    ? "align-self-end text-white"
                    : "align-self-start bg-white border"
                }`}
                style={{
                  maxWidth: "86%",
                  backgroundColor:
                    message.role === "user" ? "#1f3b73" : undefined,
                  wordBreak: "break-word",
                }}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="align-self-start px-3 py-2 rounded-3 bg-white border">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-2 border-top d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Type your message..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow border-0"
        style={{
          width: "84px",
          height: "84px",
          background: "linear-gradient(135deg, #1f3b73 0%, #2f6ea5 100%)",
          fontSize: "1.4rem",
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Open chatbot"
      >
        CB
      </button>
    </div>
  );
}

export default ChatBot;
