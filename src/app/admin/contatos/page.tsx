"use client";

import { useState, useEffect } from "react";
import { Search, Mail, Phone, Calendar, CheckCircle, Clock } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "nova" | "lida" | "respondida";
  created_at: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [statusFilter, setStatusFilter] = useState("todas");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contacts?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [statusFilter]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
      }
    } catch (err) {
      alert("Erro ao atualizar status");
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "1rem" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 900, marginBottom: "0.5rem" }}>
            Caixa de Entrada 📬
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>
            Acompanhe mensagens de clientes, orçamentos e dúvidas enviadas pelo site.
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Buscar por nome/email..."
              style={{ paddingLeft: "2.5rem", width: "250px" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select 
            className="input" 
            style={{ width: "150px" }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="nova">Não Lidas 🟢</option>
            <option value="lida">Lidas 🟡</option>
            <option value="respondida">Respondidas 🔵</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>Carregando mensagens...</div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {filteredContacts.length === 0 && (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)", background: "var(--surface)", borderRadius: "12px", border: "1px dashed var(--border)" }}>
              Nenhuma mensagem encontrada.
            </div>
          )}

          {filteredContacts.map(c => {
            const isNew = c.status === "nova";
            return (
              <div 
                key={c.id} 
                className={`card ${isNew ? 'hover-glow' : ''}`} 
                style={{ 
                  padding: "1.5rem", 
                  borderLeft: isNew ? "4px solid #10b981" : "4px solid transparent",
                  background: isNew ? "var(--surface)" : "var(--surface2)",
                  opacity: c.status === "respondida" ? 0.7 : 1
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {c.name}
                        {isNew && <span style={{ fontSize: "0.7rem", background: "#10b981", color: "white", padding: "2px 8px", borderRadius: "12px", textTransform: "uppercase", fontWeight: 800 }}>Nova</span>}
                      </h3>
                      <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Calendar size={14} /> {new Date(c.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.9rem", color: "var(--muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Mail size={16} /> <a href={`mailto:${c.email}`} className="text-blue-500 hover:underline">{c.email}</a>
                      </span>
                      {c.phone && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Phone size={16} /> <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-500 hover:underline">{c.phone}</a>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {c.status !== "nova" && (
                      <button onClick={() => updateStatus(c.id, "nova")} className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
                        Marcar Não Lida
                      </button>
                    )}
                    {c.status !== "lida" && (
                      <button onClick={() => updateStatus(c.id, "lida")} className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "rgba(234, 179, 8, 0.1)", color: "#eab308" }}>
                        <Clock size={16} /> Marcar Lida
                      </button>
                    )}
                    {c.status !== "respondida" && (
                      <button onClick={() => updateStatus(c.id, "respondida")} className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <CheckCircle size={16} /> Respondida
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ padding: "1.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  {c.subject && <div style={{ fontWeight: 800, marginBottom: "0.75rem", fontSize: "1.05rem" }}>Assunto: {c.subject}</div>}
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--text)", margin: 0 }}>
                    {c.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
