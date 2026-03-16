"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function ContatoPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Erro ao enviar mensagem.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg("Erro de comunicação com o servidor.");
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", background: "var(--background)", display: "flex", flexDirection: "column" }}>
      {/* Navbar Minimalista */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.5rem 2rem",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "rgba(10, 10, 10, 0.8)",
          backdropFilter: "blur(12px)",
          zIndex: 100
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src="/brcprint.svg" alt="BRCPrint Logo" style={{ height: "40px", objectFit: "contain" }} />
        </Link>
        <nav className="nav-links">
          <Link href="/catalogo" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700, transition: "color 0.2s" }} className="hover-glow-text">Produtos</Link>
          <Link href="/modelos-parametricos" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Customizáveis</Link>
          <Link href="/leiloes" style={{ color: "#eab308", textDecoration: "none", fontWeight: 700, transition: "color 0.2s" }} className="hover-glow-text">🔨 Leilão</Link>
          <Link href="/#como-funciona" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Como Funciona</Link>
          <Link href="/contato" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Contato</Link>

          <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 0.5rem" }} />

          <Link href="/carrinho" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }} className="hover-glow-text">
            <ShoppingCart size={18} /> Carrinho
          </Link>

          <Link href="/cliente/login" className="btn btn-primary shadow-glow" style={{ padding: "0.6rem 1.2rem", fontSize: "0.95rem", borderRadius: "8px" }}>
            Acessar Sistema
          </Link>
        </nav>
      </header>

      {/* Header Visual */}
      <section style={{ padding: "6rem 2rem 4rem", background: "linear-gradient(180deg, rgba(108, 99, 255, 0.05) 0%, transparent 100%)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, marginBottom: "1rem" }}>
          Fale <span className="gradient-text">Conosco</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: 600, margin: "0 auto" }}>
          Estamos prontos para atender você. Envie uma mensagem sobre projetos, dúvidas ou cotações exclusivas.
        </p>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "4rem", width: "100%" }}>
        {/* Info lateral */}
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "2rem" }}>Informações de Contato</h2>
          <p style={{ color: "var(--muted)", marginBottom: "3rem", lineHeight: 1.6 }}>
            Seja para produção em larga escala, impressões sob demanda ou apenas para tirar uma dúvida sobre nossos filamentos e leilões, nossa equipe de especialistas está a um clique de distância.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(108, 99, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                <Mail size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>E-mail</div>
                <div style={{ color: "var(--muted)" }}>contato@brcprint.com.br</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                <Phone size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Telefone / WhatsApp</div>
                <div style={{ color: "var(--muted)" }}>+55 (62) 98128-7680</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(234, 179, 8, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#eab308" }}>
                <MapPin size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>brcprint Digital</div>
                <div style={{ color: "var(--muted)" }}>Atendimento online para todo o Brasil.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="card" style={{ padding: "2.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>Envie sua Mensagem</h3>

          {status === "success" ? (
            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", color: "#10b981", padding: "2rem", borderRadius: "12px", textAlign: "center" }}>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Mensagem Enviada!</h4>
              <p>Recebemos o seu contato e vamos retornar em breve.</p>
              <button
                onClick={() => setStatus("idle")}
                className="btn btn-primary"
                style={{ marginTop: "1.5rem" }}
              >
                Enviar nova mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {status === "error" && (
                <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "8px", fontSize: "0.9rem" }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label className="label">Nome Completo *</label>
                  <input className="input" type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">E-mail *</label>
                  <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label className="label">Telefone (Opcional)</label>
                  <input className="input" type="text" placeholder="(11) 90000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Assunto</label>
                  <input className="input" type="text" placeholder="Ex: Parceria B2B" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Como podemos ajudar? *</label>
                <textarea
                  className="input"
                  rows={5}
                  required
                  style={{ resize: "vertical" }}
                  placeholder="Descreva seu projeto, dúvida ou necessidade..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary pulse-glow"
                style={{ marginTop: "0.5rem", padding: "1rem" }}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Enviando..." : "Enviar Mensagem 🚀"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "3rem 2rem", textAlign: "center", borderTop: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.9rem", background: "black", marginTop: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/brcprint.svg" alt="BRCPrint Logo" style={{ height: "30px", filter: "grayscale(100%) opacity(0.5)" }} />
          </div>
          <div>© {new Date().getFullYear()} brcprint. Plataforma IoT de Automação para Print Farms.</div>
        </div>
      </footer>
    </div>
  );
}
