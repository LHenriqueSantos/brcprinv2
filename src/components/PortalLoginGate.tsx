"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface Props {
  token: string;
  quoteId: number;
  clientEmail: string;
  onAuthenticated: () => void;
}

export default function PortalLoginGate({ token, quoteId, clientEmail, onAuthenticated }: Props) {
  const [email, setEmail] = useState(clientEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email.toLowerCase() !== clientEmail.toLowerCase()) {
      setError("E-mail incorreto para esta cotação.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("client", {
        redirect: false,
        email,
        password
      });

      if (result?.error) {
        setError("E-mail ou senha incorretos.");
      } else {
        onAuthenticated();
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "1rem"
    }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", padding: "2.5rem", textAlign: "center" }}>
        {/* Lock Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), #9b8bff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem", fontSize: "1.75rem"
        }}>
          🔐
        </div>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--text)" }}>
          Acesso à sua Cotação
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.5 }}>
          Esta cotação está protegida. Faça login com sua conta para continuar.
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
          <div>
            <label className="label">E-mail</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: 8,
              background: "rgba(239,68,68,0.1)", color: "#ef4444",
              fontSize: "0.85rem", fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: "100%", padding: "1rem", fontSize: "1rem",
              fontWeight: 700, marginTop: "0.5rem",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Verificando..." : "🔓 Entrar e Ver Cotação"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          Dúvidas? Entre em contato conosco pelo WhatsApp.
        </p>
      </div>
    </div>
  );
}
