"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiChatWidgetProps {
  quoteId?: number;
  token?: string;
}

export default function AiChatWidget({ quoteId, token }: AiChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou o assistente da BRCPrint. Como posso ajudar você com seu pedido ou com dúvidas sobre impressão 3D hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          quoteId,
          token
        }),
      });

      const data = await res.json();
      if (data.text) {
        setMessages([...newMessages, { role: "assistant", content: data.text }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Ops, tive um probleminha para processar isso. Pode tentar de novo?" }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Erro de conexão. Verifique sua internet." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 1000, fontFamily: "inherit" }}>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), #9b8bff)",
            color: "white", border: "none", cursor: "pointer",
            boxShadow: "0 8px 32px rgba(108, 99, 255, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <MessageSquare size={28} />
          <div style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: "#22c55e", border: "2px solid white" }}></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: "380px", height: "550px", maxWidth: "calc(100vw - 3rem)", maxHeight: "calc(100vh - 5rem)",
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column",
          overflow: "hidden", animation: "appear 0.3s ease-out"
        }}>
          {/* Header */}
          <div style={{
            padding: "1.25rem", background: "linear-gradient(135deg, var(--accent), #9b8bff)",
            color: "white", display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Assistente BRCPrint</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Online agora</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", opacity: 0.8 }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", gap: "0.5rem", flexDirection: m.role === "assistant" ? "row" : "row-reverse",
                alignItems: "flex-end", animation: "fadeIn 0.2s ease-in"
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "8px", background: m.role === "assistant" ? "var(--accent)" : "var(--surface2)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  fontSize: "0.7rem", color: m.role === "assistant" ? "white" : "var(--text)"
                }}>
                  {m.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div style={{
                  maxWidth: "80%", padding: "0.75rem 1rem", borderRadius: m.role === "assistant" ? "15px 15px 15px 2px" : "15px 15px 2px 15px",
                  background: m.role === "assistant" ? "var(--surface2)" : "var(--accent)",
                  color: m.role === "assistant" ? "var(--text)" : "white",
                  fontSize: "0.875rem", lineHeight: 1.5,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  whiteSpace: "pre-wrap"
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <div style={{ width: 28, height: 28, borderRadius: "8px", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                  <Bot size={16} />
                </div>
                <div style={{ padding: "0.75rem 1rem", borderRadius: "15px 15px 15px 2px", background: "var(--surface2)", color: "var(--muted)" }}>
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pergunte sobre seu pedido ou plásticos..."
              style={{
                flex: 1, padding: "0.75rem 1rem", borderRadius: "12px", border: "1px solid var(--border)",
                background: "var(--surface2)", color: "var(--text)", fontSize: "0.875rem", outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 42, height: 42, borderRadius: "12px", background: "var(--accent)",
                color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: (loading || !input.trim()) ? "default" : "pointer", opacity: (loading || !input.trim()) ? 0.5 : 1
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes appear {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
