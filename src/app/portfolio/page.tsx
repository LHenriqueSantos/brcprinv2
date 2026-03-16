"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PortfolioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/showroom")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#0f172a", color: "white" }}>
        <p>Carregando Vitrine...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", padding: "4rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "5rem" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "1rem", background: "linear-gradient(to right, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Showroom BRCPrint
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.25rem", maxWidth: "600px", margin: "0 auto" }}>
            Explore as melhores peças produzidas em nossa fazenda de impressão 3D e inspire-se para seu próximo projeto.
          </p>
        </header>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2.5rem" }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="showroom-card"
              style={{
                background: "rgba(30, 41, 59, 0.5)",
                backdropFilter: "blur(12px)",
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                cursor: "pointer"
              }}
            >
              {/* Photo Area */}
              <div style={{ width: "100%", height: "350px", overflow: "hidden", position: "relative" }}>
                <img
                  src={item.result_photo_url}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "1rem",
                  left: "1rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  padding: "0.5rem 1rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}>
                  🧶 {item.filament_name} ({item.filament_color})
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#f1f5f9" }}>
                  {item.title || "Peça Memorável"}
                </h3>

                <Link
                  href="/cliente/novo"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.875rem",
                    textAlign: "center",
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    borderRadius: "12px",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    transition: "opacity 0.2s"
                  }}
                >
                  Quero uma peça assim 🚀
                </Link>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "5rem", color: "#64748b" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📸</div>
            <p>Nenhuma peça na vitrine ainda. O admin precisa marcar pedidos como "Exibir na Vitrine".</p>
          </div>
        )}

        {/* Footer CTA */}
        <footer style={{ marginTop: "8rem", textAlign: "center", padding: "4rem", background: "rgba(30, 41, 59, 0.3)", borderRadius: "32px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>Tem um arquivo STL próprio?</h2>
          <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>Envie seu arquivo agora e receba um orçamento instantâneo auto-fatiado!</p>
          <Link href="/cliente/novo" style={{ background: "white", color: "#0f172a", padding: "1rem 2.5rem", borderRadius: "12px", textDecoration: "none", fontWeight: 900, fontSize: "1.1rem" }}>
            Solicitar Orçamento Grátis
          </Link>
        </footer>
      </div>

      <style jsx>{`
        .showroom-card:hover {
          transform: translateY(-8px);
          border-color: rgba(129, 140, 248, 0.5);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
}
