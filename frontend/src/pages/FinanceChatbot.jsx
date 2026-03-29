import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { sendChatMessage } from "../api";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm HackBot, your AI financial assistant. I'm connected to the HackTrix Smart Finance pipeline. I can analyze live stocks, summarize filings, or explain how our platform works. What can I help you with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(newMessages.map(m => ({ role: m.role, content: m.content })));
      setMessages([...newMessages, res.data]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }
      ]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="btn"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)",
          zIndex: 9999,
          border: "none",
          cursor: "pointer",
        }}
      >
        {open ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="card animate-in"
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: 380,
            maxWidth: "calc(100vw - 48px)",
            height: 500,
            maxHeight: "calc(100vh - 120px)",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
            border: "1px solid var(--border)",
            background: "var(--bg-primary)",
          }}
        >
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, color: "#fff" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: 8, borderRadius: "50%" }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>HackBot AI</h3>
              <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>Live Finance & Platform Intelligence</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                {m.role === "assistant" && (
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot size={14} style={{ color: "var(--accent-purple)" }} />
                  </div>
                )}
                <div style={{
                  background: m.role === "user" ? "var(--accent-blue)" : "var(--bg-secondary)",
                  color: m.role === "user" ? "#fff" : "var(--text-primary)",
                  padding: "10px 14px",
                  borderRadius: 14,
                  borderBottomRightRadius: m.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: m.role === "assistant" ? 4 : 14,
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: m.role === "user" ? "0 4px 12px rgba(30, 58, 138, 0.2)" : "none",
                  border: m.role === "assistant" ? "1px solid var(--border)" : "none",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={14} style={{ color: "var(--accent-purple)" }} />
                </div>
                <div style={{ background: "var(--bg-secondary)", padding: "10px 14px", borderRadius: 14, borderBottomLeftRadius: 4, display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--border)" }}>
                  <div className="dot-pulse"></div>
                  <div className="dot-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="dot-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, background: "var(--bg-primary)" }} onSubmit={handleSend}>
            <input
              type="text"
              className="input"
              style={{ flex: 1, padding: "10px 14px", fontSize: 13 }}
              placeholder="Ask about AAPL or the platform..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "0 14px", width: 44 }} disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        .dot-pulse {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
