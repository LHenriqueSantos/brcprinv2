"use client";

import { useState, useEffect } from "react";

export default function UpsellsAdminPage() {
  const [upsells, setUpsells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    charge_type: "fixed",
    charge_value: "",
    per_unit: true,
  });

  const [msg, setMsg] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchUpsells = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/upsells");
      const data = await res.json();
      setUpsells(Array.isArray(data) ? data : []);
    } catch {
      setUpsells([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpsells();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await fetch("/api/upsells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          charge_value: parseFloat(form.charge_value) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar opcional");

      setMsg({ text: "Opcional de Upsell cadastrado!", type: "success" });
      setForm({ name: "", description: "", charge_type: "fixed", charge_value: "", per_unit: true });
      fetchUpsells();
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, active: boolean) => {
    try {
      await fetch(`/api/upsells/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      fetchUpsells();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja apagar permanentemente esse opcional?")) return;
    try {
      await fetch(`/api/upsells/${id}`, { method: "DELETE" });
      fetchUpsells();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>🎁 Upsells (Adicionais)</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Ofereça serviços de pós-processamento na tela de cotação para aumentar seu faturamento.
      </p>

      {msg.text && (
        <div style={{
          padding: "1rem", borderRadius: 8, marginBottom: "2rem", fontWeight: 600,
          background: msg.type === "error" ? "#fee2e2" : "#dcfce7",
          color: msg.type === "error" ? "#991b1b" : "#166534"
        }}>
          {msg.text}
        </div>
      )}

      {/* Create Form */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Adicionar Novo Opcional</h2>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr 1fr" }}>

          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, fontSize: "0.875rem" }}>Nome do Opcional *</label>
            <input
              className="input"
              required
              placeholder="Ex: Pintura Primer Básico"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, fontSize: "0.875rem" }}>Descrição (O que o cliente vê?)</label>
            <input
              className="input"
              placeholder="Ex: Aplicação de duas demãos de fundo fixador."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, fontSize: "0.875rem" }}>Tipo de Cobrança</label>
            <select
              className="input"
              value={form.charge_type}
              onChange={e => setForm({ ...form, charge_type: e.target.value })}
            >
              <option value="fixed">Valor Fixo (R$)</option>
              <option value="labor_hours">Tempo de Mão de Obra (Horas)</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {form.charge_type === "fixed" ? "Valor Adicional (R$)" : "Horas Adicionais (+h)"}
            </label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder={form.charge_type === "fixed" ? "50.00" : "1.5"}
              value={form.charge_value}
              onChange={e => setForm({ ...form, charge_value: e.target.value })}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "var(--surface2)", borderRadius: 8 }}>
            <input
              type="checkbox"
              id="perUnit"
              checked={form.per_unit}
              onChange={e => setForm({ ...form, per_unit: e.target.checked })}
              style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
            />
            <div>
              <label htmlFor="perUnit" style={{ fontWeight: 700, cursor: "pointer", display: "block" }}>Cobrar por Peça (Multiplicar pela Quantidade)</label>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Se marcado, solicitar 10 peças multiplicará esse custo por 10x.</span>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Salvando..." : "Cadastrar Opcional"}
            </button>
          </div>
        </form>
      </div>

      {/* List Upsells */}
      <div className="card">
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Serviços de Pós-Processamento Cadastrados</h2>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Carregando...</p>
        ) : upsells.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Nenhum opcional cadastrado ainda.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                  <th style={{ padding: "1rem" }}>Status</th>
                  <th style={{ padding: "1rem" }}>Opcional</th>
                  <th style={{ padding: "1rem" }}>Tipo</th>
                  <th style={{ padding: "1rem" }}>Múltiplo da Peça</th>
                  <th style={{ padding: "1rem" }}>Preço Base</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {upsells.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleToggle(u.id, u.active)}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: 999,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                          background: u.active ? "#dcfce7" : "#f3f4f6",
                          color: u.active ? "#166534" : "#6b7280"
                        }}
                      >
                        {u.active ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      {u.description && <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>{u.description}</div>}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ padding: "0.3rem 0.5rem", borderRadius: 4, background: "var(--surface2)", fontSize: "0.75rem", fontWeight: 600 }}>
                        {u.charge_type === 'fixed' ? 'Valor Fixo (R$)' : 'Horas de Trabalho'}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {u.per_unit ? "Sim (Unitário)" : "Não (Lote Global)"}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 700 }}>
                      {u.charge_type === 'fixed' ? `R$ ${Number(u.charge_value).toFixed(2)}` : `+ ${u.charge_value} \u23F1`}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button onClick={() => handleDelete(u.id)} className="btn" style={{ padding: "0.4rem 0.8rem", color: "#ef4444", borderColor: "#ef444455" }}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
