"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Package } from "lucide-react";

export default function BidPackagesAdminPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    bids_amount: "",
  });

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/admin/bid-packages");
      if (res.ok) setPackages(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/bid-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsDialogOpen(false);
        setFormData({ name: "", price: "", bids_amount: "" });
        fetchPackages();
      } else {
        const data = await res.json();
        alert(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Falha: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este pacote da loja pública?")) return;
    try {
      const res = await fetch(`/api/admin/bid-packages/${id}`, { method: "DELETE" });
      if (res.ok) fetchPackages();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem" }}><Package size={22} color="#3b82f6" /> Pacotes de Lances (Loja)</h1>
          <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>Defina as quantidades e preços dos pacotes vendidos aos clientes.</p>
        </div>

        <button onClick={() => setIsDialogOpen(true)} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={16} /> Novo Pacote
        </button>
      </div>

      {isDialogOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500, padding: 0 }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Criar Pacote Comercial</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">Nome do Pacote</label>
                <input className="input" required placeholder="Ex: Pacote Ouro" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Quantidade de Lances</label>
                  <input className="input" type="number" required placeholder="Ex: 50" value={formData.bids_amount} onChange={e => setFormData({ ...formData, bids_amount: e.target.value })} />
                </div>
                <div>
                  <label className="label">Preço de Venda (R$)</label>
                  <input className="input" type="number" step="0.01" required placeholder="Ex: 35.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Publicar Pacote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela de Pacotes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              <th style={{ padding: "1rem" }}>Nome do Pacote</th>
              <th style={{ padding: "1rem" }}>Lances Entregues</th>
              <th style={{ padding: "1rem" }}>Valor Cobrado</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>Carregando prateleira...</td></tr>
            ) : packages.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Nenhum pacote à venda. A loja de lances ficará vazia.</td></tr>
            ) : (
              packages.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem", fontWeight: 700, color: "var(--text)" }}>{p.name}</td>
                  <td style={{ padding: "1rem", color: "var(--accent)", fontWeight: 800 }}>+ {p.bids_amount} Lances</td>
                  <td style={{ padding: "1rem", color: "#10b981", fontWeight: 800 }}>R$ {Number(p.price).toFixed(2)}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button onClick={() => handleDelete(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.4rem", borderRadius: 6 }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
