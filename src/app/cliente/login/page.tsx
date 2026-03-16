"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("client", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/cliente");
      router.refresh();
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", background: "var(--bg-main)" }}>
      <div className="card" style={{ maxWidth: 400, width: "100%", padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/brcprint.svg" alt="BRCPrint Logo" style={{ height: "45px", margin: "0 auto 0.5rem", display: "block" }} />
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>Portal do Cliente</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Acompanhe seus orçamentos e pedidos de impressão 3D
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="label">Senha</label>
              <Link href="/esqueci-senha" style={{ fontSize: "0.80rem", color: "var(--accent)", textDecoration: "none", cursor: "pointer" }}>Esqueci a senha?</Link>
            </div>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1.25rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.875rem" }}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Acessar Portal"}
          </button>
        </form>

        <div style={{ margin: "2rem 0", display: "flex", alignItems: "center", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>
          <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--border)" }} />
          <span style={{ padding: "0 10px" }}>Ou acessar com</span>
          <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--border)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/cliente" })}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", width: "100%", padding: "0.875rem", background: "white", color: "#333", border: "1px solid #ddd", borderRadius: "8px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
            Entrar com Google
          </button>

          <button
            type="button"
            onClick={() => alert("Login com Apple será implementado em breve.")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", width: "100%", padding: "0.875rem", background: "#000", color: "#fff", border: "1px solid #000", borderRadius: "8px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 13.91c-.02-2.85 2.33-4.22 2.44-4.29-1.32-1.93-3.38-2.2-4.08-2.23-1.74-.18-3.41 1.03-4.3 1.03-.9 0-2.26-1.01-3.72-.98-1.91.03-3.67 1.11-4.66 2.82-2.01 3.48-.51 8.65 1.45 11.48.96 1.39 2.09 2.94 3.59 2.89 1.45-.05 2.01-.93 3.76-.93 1.76 0 2.26.93 3.77.9 1.55-.02 2.53-1.41 3.48-2.8 1.1-1.6 1.55-3.15 1.57-3.23-.03-.02-2.31-.88-2.3-3.66Zm-2.58-6.1c.8-.97 1.34-2.32 1.19-3.67-1.15.05-2.58.77-3.4 1.75-.73.88-1.34 2.26-1.16 3.58 1.29.1 2.57-.69 3.37-1.66Z" /></svg>
            Entrar com Apple
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem" }}>
          Não possui conta?{" "}
          <Link href="/cliente/cadastro" style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
