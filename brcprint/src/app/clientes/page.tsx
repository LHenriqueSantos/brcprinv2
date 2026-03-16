"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  id: number; name: string; company: string; email: string; phone: string; notes: string; discount_margin_pct?: number;
}
const empty = () => ({ name: "", company: "", email: "", phone: "", notes: "", discount_margin_pct: 0 });

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<any>(empty());

  const load = () => fetch("/api/clients").then(r => r.json()).then(setClients);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setModal(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ ...c }); setModal(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/clients/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setModal(false); load();
  };

  const del = async (id: number) => {
    if (!confirm("Excluir este cliente?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" }); load();
  };

  const F = ({ label, fkey, type = "text", placeholder, step }: any) => (
    <div style={{ marginBottom: "1rem" }}>
      <label className="label">{label}</label>
      <input className="input" type={type} placeholder={placeholder} step={step} value={form[fkey] ?? ""}
        onChange={(e) => setForm({ ...form, [fkey]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Clientes</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            {clients.length} cliente(s) cadastrado(s)
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Adicionar</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nome</th><th>Empresa</th><th>Desconto VIP</th><th>E-mail</th><th>Telefone</th><th>Cadastrado em</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>
                    {c.name}
                    {c.discount_margin_pct && c.discount_margin_pct > 0 ? (
                      <span style={{ marginLeft: "8px", background: "var(--accent)", color: "white", padding: "2px 6px", borderRadius: "10px", fontSize: "0.65rem", fontWeight: "bold", verticalAlign: "middle" }}>VIP</span>
                    ) : null}
                  </td>
                  <td>{c.company || <span style={{ color: "var(--muted)" }}>–</span>}</td>
                  <td>
                    {c.discount_margin_pct && c.discount_margin_pct > 0 ? (
                      <span style={{ color: "var(--green)", fontWeight: "bold" }}>-{Number(c.discount_margin_pct).toFixed(0)}% na margem</span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>–</span>
                    )}
                  </td>
                  <td>
                    {c.email
                      ? <a href={`mailto:${c.email}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{c.email}</a>
                      : <span style={{ color: "var(--muted)" }}>–</span>}
                  </td>
                  <td>{c.phone || <span style={{ color: "var(--muted)" }}>–</span>}</td>
                  <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                    {new Date((c as any).created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href={`/clientes/${c.id}`} className="btn btn-ghost" style={{ padding: "0.3rem 0.75rem", textDecoration: "none" }} title="Assinatura & Saldo">💳</Link>
                      <button className="btn btn-ghost" style={{ padding: "0.3rem 0.75rem" }} onClick={() => openEdit(c)} title="Editar Cliente">✏️</button>
                      <button className="btn btn-danger" style={{ padding: "0.3rem 0.75rem" }} onClick={() => del(c.id)} title="Excluir">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!clients.length && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>Nenhum cliente cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? "Editar Cliente" : "Novo Cliente"}</h2>
            <form onSubmit={save}>
              <F label="Nome *" fkey="name" placeholder="Nome completo" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <F label="Empresa" fkey="company" placeholder="Nome da empresa" />
                <F label="Telefone" fkey="phone" placeholder="(11) 99999-9999" />
                <F label="E-mail" fkey="email" type="email" placeholder="email@empresa.com" />
                <F label="Desconto Especial VIP (%)" fkey="discount_margin_pct" type="number" step="0.5" placeholder="Ex: 15.0" />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Observações</label>
                <textarea className="input" rows={2} value={form.notes ?? ""} placeholder="Notas sobre o cliente…"
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
