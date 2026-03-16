"use client";

import { useState, useEffect } from "react";

export default function CuponsAdminPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", type: "percentage", value: "", usage_limit: "" });
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cupons");
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetch("/api/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: parseFloat(form.value) || 0,
          usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar cupom");
      setMsg({ text: "Cupom criado com sucesso!", type: "success" });
      setForm({ code: "", type: "percentage", value: "", usage_limit: "" });
      fetchCoupons();
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, active: boolean) => {
    try {
      await fetch(`/api/cupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active })
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este cupom permanentemente?")) return;
    try {
      await fetch(`/api/cupons/${id}`, { method: "DELETE" });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const fmt = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>🎟️ Campanhas e Cupons</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 2rem", fontSize: "0.875rem" }}>
        Crie códigos de desconto para seus clientes utilizarem nos orçamentos instântaneos.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2rem", alignItems: "start" }}>

        {/* Form Create */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem" }}>✨ Novo Cupom</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Código Promocional</label>
              <input required type="text" className="input" placeholder="Ex: BEMVINDO10" style={{ textTransform: "uppercase" }} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="percentage">% Porcentagem</option>
                  <option value="fixed">R$ Fixo</option>
                </select>
              </div>
              <div>
                <label className="label">Valor/Desconto</label>
                <input required type="number" step="0.01" min="0" className="input" placeholder="Ex: 15" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label" style={{ display: "flex", gap: "0.25rem" }}>
                Limite de Usos
                <span style={{ color: "var(--muted)", fontWeight: 400 }}>(Opcional)</span>
              </label>
              <input type="number" min="1" className="input" placeholder="Em branco = Ilimitado" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
            </div>

            {msg.text && (
              <div style={{ padding: "0.75rem", background: msg.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", color: msg.type === "error" ? "#ef4444" : "#22c55e", borderRadius: 8, fontSize: "0.85rem" }}>
                {msg.text}
              </div>
            )}

            <button disabled={submitting} type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
              🏷️ Gravar Cupom
            </button>
          </form>
        </div>

        {/* List */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Carregando cupons...</div>
          ) : coupons.length === 0 ? (
            <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--muted)" }}>Nenhum cupom criado ainda.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface2)", textAlign: "left" }}>
                  <th style={{ padding: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Código</th>
                  <th style={{ padding: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Desconto</th>
                  <th style={{ padding: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Uso</th>
                  <th style={{ padding: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", textAlign: "right" }}>Status / Ação</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c: any) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--border)", opacity: c.active ? 1 : 0.6 }}>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{c.code}</td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      <span style={{ padding: "0.25rem 0.5rem", background: "var(--surface2)", borderRadius: 6, color: "var(--accent)", fontWeight: 700 }}>
                        {c.type === "percentage" ? `${Number(c.value)}%` : fmt(Number(c.value))}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--muted)" }}>
                      {c.times_used} / {c.usage_limit ? c.usage_limit : "∞"}
                    </td>
                    <td style={{ padding: "1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button onClick={() => handleToggle(c.id, c.active)} className="btn btn-ghost" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", color: c.active ? "var(--muted)" : "var(--green)", border: c.active ? "none" : "1px solid var(--green)" }}>
                        {c.active ? "Desativar" : "Ativar"}
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-ghost" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", color: "#ef4444" }}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </>
  );
}
