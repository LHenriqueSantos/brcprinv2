"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = () => {
    setLoading(true);
    fetch("/api/admin/reviews")
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setError("Erro ao carregar avaliações"); setLoading(false); });
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchReviews();
      } else {
        alert("Erro ao atualizar status");
      }
    } catch (e) {
      alert("Erro de comunicação com o servidor.");
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Carregando avaliações...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Moderação de Avaliações</h1>
          <p style={{ color: "var(--muted)", margin: 0 }}>Aprove as fotos e os depoimentos para a Landing Page (UGC).</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
          Nenhuma avaliação recebida ainda.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative", overflow: "hidden" }}>
              {/* Status Ribbon */}
              <div style={{
                position: "absolute", top: 10, right: -30, transform: "rotate(45deg)", background: r.status === 'approved' ? "#22c55e" : r.status === 'rejected' ? "#ef4444" : "#f59e0b", color: "white", padding: "0.25rem 3rem", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase"
              }}>
                {r.status === 'pending' ? 'Pendente' : r.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.client_name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Cotação #{r.quote_id} - {r.quote_title}</div>
                </div>
                <div style={{ fontSize: "1.2rem", color: "#fbbf24" }}>
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </div>
              </div>

              {r.photo_url && (
                <div style={{ width: "100%", height: "200px", position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <img src={r.photo_url} alt="Review" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              {r.comment && (
                <div style={{ padding: "1rem", background: "var(--surface2)", borderRadius: "8px", fontSize: "0.9rem", fontStyle: "italic", color: "var(--text)" }}>
                  "{r.comment}"
                </div>
              )}

              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "auto" }}>
                Recebida em: {new Date(r.created_at).toLocaleString('pt-BR')}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                {r.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'approved')}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                  >
                    ✓ Aprovar
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'rejected')}
                    className="btn btn-ghost"
                    style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem", color: "#ef4444", borderColor: "#fecaca" }}
                  >
                    ✕ Rejeitar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
