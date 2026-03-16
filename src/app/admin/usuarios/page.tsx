"use client";

import { useState, useEffect } from "react";

export default function UsuariosAdminPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "operador"
  });

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao criar");

      setMsg({ text: "Administrador criado com sucesso!", type: "success" });
      setForm({ username: "", password: "", name: "", role: "operador" });
      fetchAdmins();
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, currentActive: boolean) => {
    try {
      await fetch(`/api/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive })
      });
      fetchAdmins();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este administrador?")) return;
    try {
      await fetch(`/api/admins/${id}`, { method: "DELETE" });
      fetchAdmins();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>👥 Gestão de Equipe e Permissões</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 2rem", fontSize: "0.875rem" }}>
        Crie e gerencie outros usuários com diferentes níveis de acesso (Admin, Vendedor, Operador).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "2rem", alignItems: "start" }}>

        {/* Create Form */}
        <div className="card">
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 1.25rem" }}>✨ Novo Membro</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="label">Nome Completo</label>
              <input
                required
                type="text"
                className="input"
                placeholder="Ex: João Silva"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Usuário / Login</label>
              <input
                required
                type="text"
                className="input"
                placeholder="Ex: joao.admin"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                required
                type="password"
                className="input"
                placeholder="Senha segura"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Nível de Acesso (Role)</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ appearance: "auto" }}
              >
                <option value="admin">Administrador (Total)</option>
                <option value="vendedor">Vendedor (Comercial)</option>
                <option value="operador">Operador (Oficina)</option>
              </select>
            </div>

            {msg.text && (
              <div style={{
                padding: "0.75rem",
                background: msg.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                color: msg.type === "error" ? "#ef4444" : "#22c55e",
                borderRadius: 8,
                fontSize: "0.85rem",
                fontWeight: 600
              }}>
                {msg.text}
              </div>
            )}

            <button disabled={submitting} type="submit" className="btn btn-primary">
              {submitting ? "Gravando..." : "✅ Salvar Membro"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Carregando...</div>
          ) : admins.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--muted)" }}>
              Nenhum membro adicional cadastrado.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface2)", textAlign: "left" }}>
                  <th style={{ padding: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Usuário/Role</th>
                  <th style={{ padding: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Nome</th>
                  <th style={{ padding: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", textAlign: "right" }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a: any) => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--border)", opacity: a.active ? 1 : 0.6 }}>
                    <td style={{ padding: "1rem" }}>
                      <code style={{ background: "var(--surface2)", padding: "0.2rem 0.4rem", borderRadius: 4, fontWeight: 700 }}>
                        {a.username}
                      </code>
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "0.25rem", textTransform: "uppercase", fontWeight: 700 }}>
                        {a.role === 'admin' ? '🛡️ Admin' : a.role === 'vendedor' ? '💼 Vendedor' : '🛠️ Operador'}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: 99,
                        background: a.active ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: a.active ? "#22c55e" : "#ef4444",
                        fontWeight: 700
                      }}>
                        {a.active ? "ATIVO" : "INATIVO"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleToggle(a.id, a.active)}
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        {a.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", color: "#ef4444" }}
                      >
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
