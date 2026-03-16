"use client";

import { useState, useEffect } from "react";

interface Affiliate {
  id: number;
  name: string;
  email: string;
  referral_code: string;
  commission_rate_pct: number;
  pix_key: string;
  active: boolean | number;
  total_referrals: number;
  total_earnings: number;
}

const empty = () => ({
  name: "",
  email: "",
  referral_code: "",
  commission_rate_pct: 10,
  pix_key: "",
  active: true
});

export default function AffiliatesAdminPage() {
  const [items, setItems] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>(empty());
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/afiliados");
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => {
    setError("");
    setForm(empty());
    setModalOpen(true);
  };

  const openEdit = (item: Affiliate) => {
    setError("");
    setForm({ ...item, active: item.active !== 0 && item.active !== false });
    setModalOpen(true);
  };

  const save = async () => {
    setError("");
    if (!form.name || !form.email || !form.referral_code) {
      setError("Nome, Email e Código são obrigatórios.");
      return;
    }

    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/admin/afiliados/${form.id}` : "/api/admin/afiliados", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao salvar parceiro.");

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const F = ({ label, fkey, type = "text", placeholder, step }: any) => (
    <div style={{ marginBottom: "1rem" }}>
      <label className="label">{label}</label>
      <input className="input" type={type} placeholder={placeholder} step={step} value={form[fkey] ?? ""}
        onChange={(e) => setForm({ ...form, [fkey]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} />
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Parceiros & Afiliados</h1>
          <p style={{ color: "var(--muted)", margin: "0.25rem 0 0" }}>
            Gerencie promotores, comissões de lucro e links de indicação.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Parceiro</button>
      </div>

      {loading ? <p>Carregando...</p> : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "1rem" }}>Status</th>
                <th style={{ padding: "1rem" }}>Nome do Parceiro</th>
                <th style={{ padding: "1rem" }}>Código do Link</th>
                <th style={{ padding: "1rem" }}>Comissão Bruta</th>
                <th style={{ padding: "1rem" }}>Conversões</th>
                <th style={{ padding: "1rem" }}>Saldo Total Acumulado</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Nenhum afiliado cadastrado. Crie o primeiro!</td></tr>
              ) : items.map(a => {
                const isActive = a.active !== 0 && a.active !== false;
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)", opacity: isActive ? 1 : 0.5 }}>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: isActive ? "var(--green)" : "var(--muted)" }}></span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{a.email}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ background: "var(--surface)", padding: "0.2rem 0.5rem", borderRadius: 4, fontFamily: "monospace", color: "var(--accent)" }}>
                        /ref/{a.referral_code}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 700 }}>
                      {Number(a.commission_rate_pct).toFixed(0)}% <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)' }}>(Lucro)</span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {a.total_referrals} Clientes
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: "var(--green)" }}>
                      R$ {Number(a.total_earnings || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button className="btn btn-ghost" onClick={() => openEdit(a)}>Editar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem", zIndex: 999
        }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--muted)" }}
            >✕</button>

            <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
              {form.id ? "Editar Parceiro" : "Novo Parceiro Afiliado"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              <F label="Nome / Empresa Parceira" fkey="name" placeholder="Ex: Canal 3D Maker" />
              <F label="Email de Contato" fkey="email" type="email" placeholder="parceiro@email.com" />

              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Código Único (URL Link)</label>
                <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <span style={{ padding: "0.75rem", color: "var(--muted)" }}>/ref/</span>
                  <input className="input" type="text" placeholder="maker3d" value={form.referral_code || ""}
                    onChange={(e) => setForm({ ...form, referral_code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    style={{ border: 'none', background: 'transparent' }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <F label="Comissão (%) s/ Lucro" fkey="commission_rate_pct" type="number" step="1" />
                <F label="Chave PIX (Para Pagamento)" fkey="pix_key" placeholder="CNPJ, Celular, Email..." />
              </div>
            </div>

            {form.id && (
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                <span style={{ fontWeight: 600 }}>Conta de Parceiro Ativa</span>
              </label>
            )}

            {error && <div style={{ color: "var(--danger)", marginTop: "1rem", fontSize: "0.85rem" }}>{error}</div>}

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar Parceiro</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
