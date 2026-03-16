"use client";

import { useEffect, useState } from "react";
import EvolutionChart from "@/components/EvolutionChart";
import MaterialRanking from "@/components/MaterialRanking";
import StatusPieChart from "@/components/StatusPieChart";
import KPICard from "@/components/KPICard";
import { getStatusInfo } from "@/lib/status";

export default function MetricsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => console.error(e));
  }, []);

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>Carregando dados de BI...</div>;

  if (data?.error) return (
    <div style={{ padding: "4rem", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
      <h2 style={{ color: "var(--text)" }}>Erro ao carregar métricas</h2>
      <p style={{ color: "var(--muted)" }}>{data.error}</p>
    </div>
  );

  const S = data?.summary || {};
  const conversionStats = data?.conversionStats || [];

  const fmt = (v: number) =>
    (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const pieData = conversionStats.map((s: any) => {
    const info = getStatusInfo(s.status);
    return { status: info.label, count: s.count, color: info.color };
  });

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "--";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div style={{ padding: "1rem" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 900, marginBottom: "0.5rem", background: "linear-gradient(135deg, white, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          📊 Dashboard Analítico
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>
          Visão executiva de faturamento, produção e eficiência operacional.
        </p>
      </header>

      {/* Financial Section */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          💰 Performance Financeira
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
          <KPICard title="Faturamento Bruto" value={fmt(S.revenue)} icon="💰" color="#6c63ff" subtitle="Total aprovado" />
          <KPICard title="Lucro Líquido" value={fmt(S.profit)} icon="📈" color="#22c55e" subtitle="Pós custos & taxas" />
          <KPICard title="Impostos Acumulados" value={fmt(S.taxes)} icon="🏛️" color="#ef4444" subtitle={`Ref. taxa configurada`} />
          <KPICard title="Margem de Lucro" value={`${S.approval_rate.toFixed(1)}%`} icon="🎯" color="#f59e0b" subtitle="Eficiência global" />
        </div>
      </section>

      {/* Production & Conversion Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", marginBottom: "3rem" }}>

        {/* Left: Production Stats */}
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1.5rem" }}>
            🏭 Produção & Volume
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <KPICard title="Tempo de Impressão" value={`${S.total_hours.toFixed(1)}h`} icon="⏱️" color="#3b82f6" />
            <KPICard title="Consumo Material" value={`${(S.total_filament_g / 1000).toFixed(2)} kg`} icon="⚖️" color="#9333ea" />
          </div>
          <EvolutionChart data={data.revenueByMonth} />
        </div>

        {/* Right: Conversion & Status */}
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1.5rem" }}>
            🔄 Funil de Conversão
          </h2>
          <div style={{ background: "var(--surface)", borderRadius: "20px", padding: "1.5rem", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Taxa de Aprovação</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{S.approval_rate.toFixed(1)}%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Tempo de Resposta</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{formatTime(S.avg_response_time)}</div>
              </div>
            </div>
            <div style={{ height: "8px", background: "var(--surface2)", borderRadius: "4px", overflow: "hidden", display: "flex", marginBottom: "1rem" }}>
              <div style={{ width: `${S.approval_rate}%`, background: "var(--accent)", height: "100%" }} />
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>
              Dos {S.total_quotes} orçamentos criados, {S.approved_quotes} foram convertidos em pedidos.
            </p>
          </div>
          <StatusPieChart data={pieData} />
        </div>
      </div>

      {/* Material & Machine Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem" }}>
        <MaterialRanking data={data.materialUsage} />

        <div className="card" style={{ padding: "1.5rem", borderRadius: "20px" }}>
          <h3 style={{ margin: "0 0 1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            📟 Desempenho por Máquina
          </h3>
          <div className="table-wrap">
            <table style={{ width: "100%" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase" }}>Impressora</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase" }}>Carga Horária</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase" }}>Manutenção Real</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase" }}>Receita</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase" }}>ROI Capital</th>
                </tr>
              </thead>
              <tbody>
                {data.printerPerformance.map((p: any) => (
                  <tr key={p.printer_name} style={{ borderTop: "1px solid var(--border)", transition: "background 0.2s" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700 }}>{p.printer_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Impressora</div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "1.1rem", fontWeight: 500 }}>{Number(p.total_hours).toFixed(1)}h</td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ color: Number(p.total_maint_cost) > 0 ? "#ef4444" : "var(--muted)", fontSize: "0.9rem", fontWeight: 600 }}>
                        {fmt(Number(p.total_maint_cost))}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ color: "var(--text)", fontWeight: 800, fontSize: "1.1rem" }}>{fmt(Number(p.total_revenue))}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {p.purchase_price > 0 ? (
                        <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: "1.1rem" }}>
                          {(((Number(p.total_revenue) - Number(p.total_maint_cost)) / Number(p.purchase_price)) * 100).toFixed(1)}%
                        </div>
                      ) : <span style={{ color: "var(--muted)" }}>--</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
