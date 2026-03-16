"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function ClientRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cliente/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      // Efetua login automático após o cadastro
      const loginRes = await signIn("client", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        throw new Error("Conta criada, mas erro ao fazer login automático.");
      }

      router.push("/cliente");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", background: "var(--bg-main)" }}>
      <div className="card" style={{ maxWidth: 450, width: "100%", padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Criar sua Conta</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.5rem 0 0" }}>
            Preencha seus dados para solicitar orçamentos
          </p>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="label">Nome Completo</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label className="label">WhatsApp (Opcional)</label>
            <input
              type="text"
              className="input"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.3rem" }}>Mínimo de 6 caracteres</div>
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1.25rem", textAlign: "center", padding: "0.5rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.875rem" }}
            disabled={loading}
          >
            {loading ? "Criando Conta..." : "Cadastrar"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem" }}>
          Já possui uma conta?{" "}
          <Link href="/cliente/login" style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
