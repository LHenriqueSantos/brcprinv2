"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, Cpu, Loader2, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ParametricModelsShowcase() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useSession();

  useEffect(() => {
    fetch("/api/admin/scad-models")
      .then(res => res.json())
      .then(data => {
        // Show only active items to public
        if (Array.isArray(data)) {
          setModels(data.filter((m: any) => m.active));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--accent)" }}>
        <Loader2 size={48} className="animate-spin" />
        <p style={{ marginTop: "1rem", fontWeight: 600 }}>Carregando catálogo interativo...</p>
      </div>
    );
  }

  // Ocultar base header se logado (o Sidebar do ClientWrapper assume o Navbar superior nessas rotas)
  const isLogged = status === "authenticated";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Navbar Minimalista (Global) */}
      {!isLogged && (
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link href="/">
              <img src="/brcprint.svg" alt="BRCPrint Logo" style={{ height: "40px", objectFit: "contain" }} />
            </Link>
          </div>
          <nav className="nav-links">
            <Link href="/catalogo" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Produtos</Link>
            <Link href="/modelos-parametricos" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700, transition: "color 0.2s" }} className="hover-glow-text">Customizáveis</Link>
            <Link href="/#como-funciona" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Como Funciona</Link>
            <Link href="/#beneficios" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Vantagens</Link>

            <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 0.5rem" }} />

            <Link href="/carrinho" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }} className="hover-glow-text">
              <ShoppingCart size={18} /> Carrinho
            </Link>

            <Link href="/cliente/login" className="btn btn-primary shadow-glow" style={{ padding: "0.6rem 1.2rem", fontSize: "0.95rem", borderRadius: "8px" }}>
              Acessar Sistema
            </Link>
          </nav>
        </header>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto 4rem auto" }}>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.5rem", background: "linear-gradient(to right, #60a5fa, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Peças Exclusivas & Customizáveis
          </h1>
          <p style={{ fontSize: "1.125rem", color: "var(--muted)", lineHeight: 1.6 }}>
            Você define as dimensões e marcações, e nosso motor inteligente gera a geometria 3D única para você na hora. Escolha um modelo e comece a criar o seu.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
          {models.map((model: any) => (
            <div key={model.id} style={{ display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden", transition: "transform 0.2s, border-color 0.2s", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} className="hover-card">
              <div style={{ aspectRatio: "4/3", position: "relative", overflow: "hidden", background: "#000" }}>
                <img
                  src={model.image_url || "/brcprint.png"}
                  alt={model.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
                />
                <div style={{ position: "absolute", top: "1rem", left: "1rem", padding: "0.4rem 0.8rem", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "100px", color: "#10b981", fontSize: "0.7rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.4rem", backdropFilter: "blur(4px)" }}>
                  <Cpu size={12} /> MODELO EDITÁVEL
                </div>
              </div>

              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>{model.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.5rem", flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {model.description || "Personalize este modelo mudando os parâmetros conforme sua necessidade."}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>A partir de</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>R$ {Number(model.base_price).toFixed(2)}</span>
                  </div>

                  <Link href={`/modelos-parametricos/${model.id}`} style={{ textDecoration: "none" }}>
                    <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.25rem", borderRadius: "12px", fontWeight: 700 }}>
                      Customizar <ArrowRight size={18} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {models.length === 0 && (
          <div style={{ textAlign: "center", padding: "5rem 2rem", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "24px" }}>
            <div style={{ display: "inline-flex", width: "64px", height: "64px", borderRadius: "50%", background: "var(--surface2)", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
              <Box size={32} style={{ color: "var(--muted)" }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)" }}>Novidades a Caminho</h3>
            <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>Estamos desenvolvendo novos modelos editáveis. Volte em breve!</p>
          </div>
        )}

        <style jsx>{`
        .hover-card:hover {
          transform: translateY(-5px);
          border-color: var(--accent) !important;
        }
      `}</style>
      </div>
    </div>
  );
}
