"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, AlertCircle, Package } from "lucide-react";

export default function PublicProjectPage() {
  const params = useParams();
  const token = params.token as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    fetch(`/api/public/projects/${token}`)
      .then(res => {
        if (!res.ok) throw new Error("Projeto não encontrado ou link inválido.");
        return res.json();
      })
      .then(data => {
        setProject(data);
        if (data.status === 'approved') setApproved(true);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/public/projects/${token}/approve`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao aprovar projeto");
      }
      setApproved(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApproving(false);
    }
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Carregando dados do projeto...</div>;
  if (error) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--accent2)" }}>{error}</div>;
  if (!project) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "white", marginBottom: "1rem" }}>
            <Package size={32} />
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>{project.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", margin: 0 }}>
            Proposta p/ {project.client_name || project.client_company || "Cliente BRCPrint"}
          </p>
        </div>

        {/* Status Alert */}
        {approved ? (
          <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "1.5rem", borderRadius: 12, display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
            <CheckCircle size={24} style={{ color: "var(--green)" }} />
            <div>
              <h3 style={{ color: "var(--green)", margin: "0 0 0.25rem 0", fontWeight: 700 }}>Projeto Aprovado!</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>Todas as peças já foram enviadas para nossa fila de produção. Em breve as impressoras começarão o trabalho.</p>
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(108, 99, 255, 0.1)", border: "1px solid rgba(108, 99, 255, 0.3)", padding: "1.5rem", borderRadius: 12, display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
            <AlertCircle size={24} style={{ color: "var(--accent)" }} />
            <div>
              <h3 style={{ color: "var(--accent)", margin: "0 0 0.25rem 0", fontWeight: 700 }}>Aguardando sua aprovação</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>Revise os itens do projeto abaixo. Ao aprovar, todas as peças entrarão em produção.</p>
            </div>
          </div>
        )}

        {/* Parts List */}
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Itens do Projeto</h2>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: "2rem" }}>
          {project.quotes?.map((q: any, i: number) => (
            <div key={q.id} style={{ padding: "1rem 1.5rem", borderBottom: i < project.quotes.length - 1 ? "1px solid var(--border)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{q.title || `Peça #${q.id}`}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                  {q.quantity}x • {q.filament_name} ({q.filament_color})
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>{fmt(q.final_price)}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{fmt(q.final_price_per_unit)} /unid</div>
              </div>
            </div>
          ))}
        </div>

        {/* Total and CTA */}
        <div style={{ background: "var(--surface2)", padding: "2rem", borderRadius: 16, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>Total do Projeto</div>
              <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "0.25rem" }}>{project.quotes?.length} itens diferentes</div>
            </div>
            <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--green)", lineHeight: 1 }}>
              {fmt(project.total_price)}
            </div>
          </div>

          {!approved && (
            <button
              onClick={handleApprove}
              disabled={approving}
              style={{
                width: "100%", padding: "1rem", borderRadius: 12, border: "none",
                background: "var(--accent)", color: "white", fontWeight: 700, fontSize: "1.1rem",
                cursor: approving ? "not-allowed" : "pointer", opacity: approving ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(108, 99, 255, 0.4)",
                transition: "all 0.2s"
              }}
            >
              {approving ? "Aprovando..." : "✅ Aprovar Projeto Inteiro"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
