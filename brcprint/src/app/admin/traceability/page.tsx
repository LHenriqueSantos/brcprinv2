"use client";

import { useState } from "react";

export default function TraceabilityPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/admin/traceability?lot=${encodeURIComponent(search)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 900, marginBottom: "0.5rem", background: "linear-gradient(135deg, white, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🔍 Rastreabilidade de Materiais
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>
          Busque por número de lote para identificar pedidos, clientes e datas de produção.
        </p>
      </header>

      <div className="card" style={{ padding: "2rem", marginBottom: "2rem", border: "1px solid var(--accent)" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem" }}>
          <input
            className="input"
            style={{ flex: 1, fontSize: "1.2rem", padding: "1rem" }}
            placeholder="Digite o ID do Rolo ou Número do Lote (Ex: ABC-123)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "0 2rem" }} disabled={loading}>
            {loading ? "Buscando..." : "Pesquisar"}
          </button>
        </form>
      </div>

      {searched && (
        <div className="card" style={{ padding: "1rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem", padding: "0.5rem" }}>
            Resultados para: <span style={{ color: "var(--accent)" }}>{search}</span>
            <span style={{ marginLeft: "1rem", fontSize: "0.9rem", color: "var(--muted)", fontWeight: 400 }}>
              ({results.length} registros encontrados)
            </span>
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "var(--surface2)", borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "1rem" }}>Pedido</th>
                  <th style={{ padding: "1rem" }}>Material/Lote</th>
                  <th style={{ padding: "1rem" }}>Cliente</th>
                  <th style={{ padding: "1rem" }}>Data Produção</th>
                  <th style={{ padding: "1rem" }}>Contato</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any) => (
                  <tr key={r.quote_id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 800 }}>#{r.quote_id}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{r.quote_title}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--accent)" }}>{r.lot_number}</div>
                      <div style={{ fontSize: "0.8rem" }}>{r.filament_name} ({r.filament_type})</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700 }}>{r.client_name}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{r.client_company}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {new Date(r.production_date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.85rem" }}>📧 {r.client_email}</div>
                      <div style={{ fontSize: "0.85rem" }}>📱 {r.client_phone}</div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
                      ⚠️ Nenhum pedido vinculado a este número de lote foi encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
