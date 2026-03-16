"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ClientProfile() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    document: "",
    zipcode: "",
    address: "",
    address_number: "",
    address_comp: "",
    neighborhood: "",
    city: "",
    state: ""
  });

  useEffect(() => {
    fetch("/api/clients/me")
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setForm({
            name: data.name || "",
            email: data.email || "",
            company: data.company || "",
            phone: data.phone || "",
            document: data.document || "",
            zipcode: data.zipcode || "",
            address: data.address || "",
            address_number: data.address_number || "",
            address_comp: data.address_comp || "",
            neighborhood: data.neighborhood || "",
            city: data.city || "",
            state: data.state || ""
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/clients/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: "Perfil atualizado com sucesso!" });
        // Update session to reflect new name if it changed
        await update({ name: form.name });
      } else {
        setMessage({ type: 'error', text: data.error || "Erro ao atualizar perfil." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Erro na comunicação com o servidor." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Carregando perfil...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--text)" }}>Meu Perfil</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          Mantenha seus dados atualizados para facilitar orçamentos e entregas.
        </p>
      </header>

      {message && (
        <div style={{
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          backgroundColor: message.type === 'success' ? "#ecfdf5" : "#fef2f2",
          color: message.type === 'success' ? "#065f46" : "#991b1b",
          border: `1px solid ${message.type === 'success' ? "#a7f3d0" : "#fecaca"}`,
          fontWeight: 600
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="card" style={{ padding: "2rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>Dados Pessoais</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Nome Completo</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">E-mail (Não editável)</label>
            <input
              type="email"
              className="input"
              value={form.email}
              disabled
              style={{ background: "var(--surface2)", cursor: "not-allowed", opacity: 0.7 }}
            />
          </div>

          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input
              type="text"
              className="input"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="label">Empresa / Razão Social</label>
            <input
              type="text"
              className="input"
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
            />
          </div>

          <div>
            <label className="label">CPF / CNPJ</label>
            <input
              type="text"
              className="input"
              value={form.document}
              onChange={e => setForm({ ...form, document: e.target.value })}
            />
          </div>
        </div>

        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>Endereço de Entrega</h3>

        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <label className="label">CEP</label>
            <input
              type="text"
              className="input"
              value={form.zipcode}
              onChange={e => setForm({ ...form, zipcode: e.target.value })}
              maxLength={9}
            />
          </div>
          <div>
            <label className="label">Logradouro / Rua</label>
            <input
              type="text"
              className="input"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div style={{ gridColumn: "1 / 2" }}>
            <label className="label">Número</label>
            <input
              type="text"
              className="input"
              value={form.address_number}
              onChange={e => setForm({ ...form, address_number: e.target.value })}
            />
          </div>
          <div style={{ gridColumn: "2 / 3" }}>
            <label className="label">Complemento</label>
            <input
              type="text"
              className="input"
              value={form.address_comp}
              onChange={e => setForm({ ...form, address_comp: e.target.value })}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "1.5rem" }}>
              <div>
                <label className="label">Bairro</label>
                <input
                  type="text"
                  className="input"
                  value={form.neighborhood}
                  onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input
                  type="text"
                  className="input"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Estado (UF)</label>
                <input
                  type="text"
                  className="input"
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: 700 }}
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
