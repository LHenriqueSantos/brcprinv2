"use client";

import { useEffect, useState, useRef } from "react";

interface ChatMessage {
  id: number;
  sender_type: 'admin' | 'client';
  message: string;
  created_at: string;
}

export default function ChatBox({ quoteId, token, currentUserType }: { quoteId: number, token?: string, currentUserType: 'admin' | 'client' }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const url = `/api/quotes/${quoteId}/messages${token ? `?token=${token}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling every 5 seconds
    return () => clearInterval(interval);
  }, [quoteId, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");

    // Optimistic insert
    const tempId = Date.now();
    setMessages((prev) => [...prev, { id: tempId, sender_type: currentUserType, message: msg, created_at: new Date().toISOString() }]);

    try {
      const url = `/api/quotes/${quoteId}/messages`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: msg }),
      });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", height: 450, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", background: "var(--surface2)", fontWeight: 700 }}>
        💬 Central de Mensagens
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", background: "var(--background)" }}>
        {loading && <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.875rem" }}>Carregando mensagens...</div>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.875rem", margin: "auto" }}>
            Nenhuma mensagem ainda. Mande um olá!
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.sender_type === currentUserType;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: "0.2rem", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                {m.sender_type === "admin" ? "Suporte" : "Cliente"} • {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{
                maxWidth: "85%",
                padding: "0.75rem 1rem",
                borderRadius: 16,
                borderBottomRightRadius: isMe ? 0 : 16,
                borderBottomLeftRadius: isMe ? 16 : 0,
                background: isMe ? "var(--accent)" : "var(--surface)",
                color: isMe ? "#fff" : "var(--text)",
                border: isMe ? "none" : "1px solid var(--border)",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap"
              }}>
                {m.message}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "1rem", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          className="input"
          placeholder="Digite sua mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <button className="btn btn-primary" onClick={sendMessage} disabled={!text.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}
