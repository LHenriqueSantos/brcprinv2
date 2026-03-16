"use client";

import { useState, useEffect } from "react";

interface Commission {
  id: number;
  commission_amount: string;
  status: string;
  created_at: string;
  affiliate_id: number;
  affiliate_name: string;
  pix_key: string;
  quote_token: string;
}

export default function PayoutsAdminPage() {
  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/afiliados/saques");
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const markAsPaid = async (id: number) => {
    if (!confirm("Confirmar que você já realizou o PIX para o parceiro?")) return;
    try {
      await fetch(`/api/admin/afiliados/saques/${id}`, { method: "PUT" });
      loadData();
    } catch (e) {
      console.error(e);
      alert("Erro ao marcar como pago");
    }
  };

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Comissões e Saques</h1>
        <p style={{ color: "var(--muted)", margin: "0.25rem 0 0" }}>
          Controle de pagamentos aos parceiros afiliados.
        </p>
      </div>

      {loading ? <p>Carregando...</p> : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "1rem" }}>Data</th>
                <th style={{ padding: "1rem" }}>Parceiro</th>
                <th style={{ padding: "1rem" }}>Chave PIX</th>
                <th style={{ padding: "1rem" }}>Origem (Cotação)</th>
                <th style={{ padding: "1rem" }}>Valor da Comissão</th>
                <th style={{ padding: "1rem" }}>Status</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Nenhuma comissão registrada ainda.</td></tr>
              ) : items.map(c => {
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem" }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: "1rem", fontWeight: 600 }}>{c.affiliate_name}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ fontSize: "0.85rem", background: "var(--surface)", padding: "0.25rem 0.5rem", borderRadius: 4 }}>
                        {c.pix_key || "Não cadastrada"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <a href={`/portal/${c.quote_token}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                        Ver Pedido
                      </a>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: "var(--green)" }}>
                      R$ {Number(c.commission_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {c.status === 'paid' ? (
                        <span style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--green)", padding: "0.25rem 0.5rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600 }}>Pago</span>
                      ) : (
                        <span style={{ background: "rgba(234, 179, 8, 0.1)", color: "#eab308", padding: "0.25rem 0.5rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600 }}>Pendente</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      {c.status === 'available' || c.status === 'pending' ? (
                        <button className="btn btn-primary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }} onClick={() => markAsPaid(c.id)}>Marcar Pago (PIX)</button>
                      ) : <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>LiquidadO</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
