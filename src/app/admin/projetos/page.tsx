"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, CheckCircle, Clock } from "lucide-react";

export default function ProjetosPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const loadProjects = () => {
    fetch("/api/admin/projects")
      .then(r => r.json())
      .then(data => setProjects(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/portal/projeto/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este projeto? (As cotações voltarão a ficar avulsas)")) return;
    try {
      await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      loadProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Projetos & Kits</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Agrupamentos de múltiplas cotações
          </p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome do Projeto</th>
                <th>Cliente</th>
                <th style={{ textAlign: "center" }}>Itens</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Data</th>
                <th>Link de Aprovação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--muted)" }}>#{p.id}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{p.title}</span>
                  </td>
                  <td>{p.client_name || <span style={{ color: "var(--muted)" }}>Avulso</span>}</td>
                  <td style={{ textAlign: "center" }}><span className="badge badge-default">{p.items_count} peças</span></td>
                  <td style={{ color: "var(--green)", fontWeight: 700 }}>{fmt(p.total_price)}</td>
                  <td>
                    {p.status === 'approved' ? (
                      <span className="badge badge-petg"><CheckCircle size={12} className="inline mr-1" /> Aprovado</span>
                    ) : (
                      <span className="badge badge-default"><Clock size={12} className="inline mr-1" /> Aguardando</span>
                    )}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td>
                    <button
                      onClick={() => handleCopyLink(p.public_token)}
                      className="btn btn-ghost"
                      style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                    >
                      <Copy size={14} /> {copiedToken === p.public_token ? "Copiado!" : "Copiar Link"}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-danger"
                      style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                    >
                      Desfazer
                    </button>
                  </td>
                </tr>
              ))}
              {!projects.length && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                    Nenhum projeto agrupado. Vá em "Cotações", selecione múltiplas peças e clique em "Criar Projeto".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
