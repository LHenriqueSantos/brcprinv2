"use client";

import { useState, useEffect } from "react";
import { Gavel, Clock, Tag, ExternalLink } from "lucide-react";
import Link from "next/link";
import AiChatWidget from "@/components/AiChatWidget";

export default function MeusLancesPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cliente/meus-lances")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBids(data);
        } else {
          setBids([]);
          console.error("API Error:", data);
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: "999px", background: "rgba(234, 179, 8, 0.15)", color: "#facc15", fontWeight: 800, fontSize: "0.8rem", marginBottom: "1rem", border: "1px solid rgba(234, 179, 8, 0.4)" }}>
            <Gavel size={14} /> Atividade no Leilão
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Meu Histórico de Lances</h1>
          <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>Acompanhe onde você gastou seus lances recentemente.</p>
        </div>

        <Link href="/leiloes/comprar-lances" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#ca8a04", color: "#fff", border: "none" }}>
          🪙 Comprar mais Lances
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Carregando seu histórico...</div>
        ) : bids.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--muted)" }}>
            <Clock size={40} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>Você ainda não participou de nenhum leilão.</h3>
            <p>Navegue pelo Catálogo de Leilões e dê seu primeiro lance!</p>
            <Link href="/leiloes" className="btn btn-ghost" style={{ marginTop: "1.5rem", display: "inline-block", color: "var(--accent)" }}>Explorar Leilões</Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Data/Hora</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Produto Disputado</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Valor da Oferta</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Status do Leilão</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((b, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1.2rem 1rem", fontSize: "0.9rem", color: "var(--muted)" }}>
                    {new Date(b.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td style={{ padding: "1.2rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <img src={b.image_url || "/placeholder.png"} alt={b.title} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{b.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: "1.2rem 1rem", textAlign: "center", fontWeight: 800, color: "#10b981", fontSize: "1.1rem" }}>
                    R$ {Number(b.amount).toFixed(2).replace('.', ',')}
                  </td>
                  <td style={{ padding: "1.2rem 1rem", textAlign: "center" }}>
                    {b.auction_status === "active" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 700, color: "#facc15", padding: "0.3rem 0.6rem", background: "rgba(234, 179, 8, 0.1)", borderRadius: 6 }}>
                        <Clock size={14} /> Ao Vivo
                      </span>
                    ) : b.auction_status === "finished" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", padding: "0.3rem 0.6rem", background: "var(--surface2)", borderRadius: 6 }}>
                        <Tag size={14} /> Encerrado
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{b.auction_status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AiChatWidget mode="portal" />
    </div>
  );
}
