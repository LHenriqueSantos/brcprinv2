"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStatusInfo } from "@/lib/status";
import { Copy, PlusSquare } from "lucide-react";

export default function CotacoesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const loadQuotes = () => {
    fetch("/api/quotes?limit=100").then(r => r.json()).then(setQuotes);
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === quotes.filter(q => q.status === 'draft' && !q.project_id).length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(quotes.filter(q => q.status === 'draft' && !q.project_id).map(q => q.id));
    }
  };

  const createProject = async () => {
    if (!projectTitle || selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      // Find client_id from the first selected quote (we assume they belong to the same client or generic)
      const firstQuote = quotes.find(q => q.id === selectedIds[0]);
      const clientId = firstQuote?.client_id || null;

      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle,
          client_id: clientId,
          quote_ids: selectedIds
        })
      });

      if (!res.ok) throw new Error("Erro ao criar projeto");

      alert("Projeto criado com sucesso!");
      setIsCreatingProject(false);
      setProjectTitle("");
      setSelectedIds([]);
      loadQuotes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Histórico de Cotações</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            {quotes.length} cotação(ões) registrada(s)
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {selectedIds.length > 0 && (
            <button
              className="btn btn-primary"
              style={{ background: "var(--accent2)" }}
              onClick={() => setIsCreatingProject(true)}
            >
              <PlusSquare size={16} /> Criar Projeto ({selectedIds.length})
            </button>
          )}
          <Link href="/cotacoes/nova"><button className="btn btn-primary">+ Nova Cotação</button></Link>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: "center" }}>
                  <input type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === quotes.filter(q => q.status === 'draft' && !q.project_id).length}
                    onChange={toggleAll}
                  />
                </th>
                <th>#</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Impressora</th>
                <th>Filamento</th>
                <th style={{ textAlign: "center" }}>Qtd</th>
                <th>Margem</th>
                <th>Preço/peça</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q: any) => {
                const st = getStatusInfo(q.status);
                const isSelectable = q.status === 'draft' && !q.project_id;

                return (
                  <tr key={q.id} style={{ opacity: q.project_id ? 0.6 : 1 }}>
                    <td style={{ textAlign: "center" }}>
                      {isSelectable ? (
                        <input type="checkbox"
                          checked={selectedIds.includes(q.id)}
                          onChange={() => toggleSelect(q.id)}
                        />
                      ) : q.project_id ? (
                        <span style={{ fontSize: "10px", color: "var(--muted)", background: "var(--surface2)", padding: 4, borderRadius: 4 }}>P</span>
                      ) : null}
                    </td>
                    <td style={{ color: "var(--muted)" }}>#{q.id}</td>
                    <td>
                      <Link href={`/cotacoes/${q.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                        {q.title || "Sem título"}
                      </Link>
                    </td>
                    <td>{q.client_name || <span style={{ color: "var(--muted)" }}>Avulso</span>}</td>
                    <td>{q.printer_name}</td>
                    <td>
                      <span style={{ fontSize: "0.8rem" }}>{q.filament_name}</span>
                      <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{q.filament_type}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>{q.quantity}</td>
                    <td style={{ color: "var(--accent)" }}>{q.profit_margin_pct}%</td>
                    <td style={{ color: "var(--green)", fontWeight: 700 }}>{fmt(q.final_price_per_unit)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <div style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: `${st.color}22`, color: st.color }}>
                          {st.icon} {st.label}
                        </div>
                        {q.is_paid && <span title="Pago" style={{ fontSize: "1rem" }}>💰</span>}
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                      {new Date(q.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
              {!quotes.length && (
                <tr><td colSpan={11} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                  Nenhuma cotação ainda. <Link href="/cotacoes/nova" style={{ color: "var(--accent)" }}>Criar a primeira →</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreatingProject && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Agrupar {selectedIds.length} cotações num Projeto</h2>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Nome do Projeto</label>
              <input
                type="text"
                className="input"
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
                placeholder="Ex:: Impressão Braço Robótico"
                autoFocus
              />
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "2rem" }}>
              Ao agrupar, o sistema gera um link unificado para o cliente aprovar todas as peças juntas. As cotações selecionadas devem pertencer ao mesmo cliente (ou serem avulsas).
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setIsCreatingProject(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={createProject} disabled={isSubmitting || !projectTitle}>
                {isSubmitting ? "Criando..." : "Criar Projeto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
