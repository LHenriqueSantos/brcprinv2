"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminPlanosPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", monthly_price: 0, hours_included: 0, active: true, filament_type: "PLA", b2b_filament_cost: 0, grams_included: 0 });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription-plans");
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: any) => {
    if (plan) {
      setEditingId(plan.id);
      setFormData({
        name: plan.name,
        monthly_price: Number(plan.monthly_price),
        hours_included: Number(plan.hours_included),
        active: plan.active === 1,
        filament_type: plan.filament_type || "PLA",
        b2b_filament_cost: Number(plan.b2b_filament_cost || 0),
        grams_included: Number(plan.grams_included || 0)
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", monthly_price: 0, hours_included: 0, active: true, filament_type: "PLA", b2b_filament_cost: 0, grams_included: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...formData, id: editingId } : formData;

    try {
      await fetch("/api/subscription-plans", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setIsModalOpen(false);
      fetchPlans();
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este plano?")) return;
    try {
      await fetch(`/api/subscription-plans?id=${id}`, { method: "DELETE" });
      fetchPlans();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Carregando Planos...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Planos de Assinatura (B2B) 🔁</h1>
          <p style={{ color: "var(--text-muted)" }}>Gerencie pacotes mensais de Banco de Horas para clientes corporativos.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn" style={{ background: "var(--accent)", color: "#000" }}>+ Novo Plano</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {plans.map(p => (
          <div key={p.id} className="card" style={{ padding: "1.5rem", borderRadius: 12, borderTop: `4px solid ${p.active ? 'var(--accent)' : 'red'}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{p.name}</h3>
              {!p.active && <span style={{ fontSize: "0.7rem", background: "red", color: "#fff", padding: "2px 6px", borderRadius: 4 }}>Inativo</span>}
            </div>

            <div style={{ margin: "1.5rem 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Valor Mensal</div>
                <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>R$ {Number(p.monthly_price).toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Franquia Inclusa</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--accent)" }}>{Number(p.hours_included)} h</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--accent)" }}>{Number(p.grams_included)} g</div>
              </div>
            </div>

            {(p.filament_type || p.b2b_filament_cost > 0) && (
              <div style={{ marginBottom: "1.5rem", padding: "0.75rem", background: "var(--surface2)", borderRadius: 8, fontSize: "0.85rem" }}>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>Material Vip B2B: {p.filament_type || "N/A"}</div>
                <div style={{ color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Custo Fixo na compra avulsa: <strong>R$ {Number(p.b2b_filament_cost).toFixed(2)}/kg</strong>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => handleOpenModal(p)} className="btn btn-ghost" style={{ flex: 1 }}>Editar</button>
              <button onClick={() => handleDelete(p.id)} className="btn btn-ghost" style={{ background: "rgba(255, 0,0, 0.1)", color: "red" }}>✕</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Nenhum plano cadastrado.</div>}
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ width: 400, padding: "2rem", borderRadius: 12 }}>
            <h2 style={{ marginBottom: "1.5rem" }}>{editingId ? "Editar Plano" : "Novo Plano"}</h2>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Nome do Pacote</label>
                <input required type="text" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Studio VIP" />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Preço Mensal (R$)</label>
                  <input required type="number" step="0.01" className="input" value={formData.monthly_price} onChange={e => setFormData({ ...formData, monthly_price: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Franquia (Horas)</label>
                  <input required type="number" step="0.5" className="input" value={formData.hours_included} onChange={e => setFormData({ ...formData, hours_included: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Franquia (Gramas)</label>
                  <input required type="number" step="1" className="input" value={formData.grams_included} onChange={e => setFormData({ ...formData, grams_included: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Tipo de Filamento (Desconto VIP)</label>
                  <input type="text" className="input" value={formData.filament_type} onChange={e => setFormData({ ...formData, filament_type: e.target.value })} placeholder="Ex: PLA, PETG" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Custo B2B Especial (R$/kg)</label>
                  <input required type="number" step="0.01" className="input" value={formData.b2b_filament_cost} onChange={e => setFormData({ ...formData, b2b_filament_cost: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input type="checkbox" id="activeToggle" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
                <label htmlFor="activeToggle" style={{ fontSize: "0.9rem", cursor: "pointer" }}>Plano Ativo (Disponível)</label>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn" style={{ flex: 1, background: "var(--accent)", color: "#000" }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
