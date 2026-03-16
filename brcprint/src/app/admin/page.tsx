"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getStatusInfo } from "@/lib/status";
import KPICard from "@/components/KPICard";
import RevenueChart from "@/components/RevenueChart";
import StatusPieChart from "@/components/StatusPieChart";

interface Stats {
  total_quotes: number;
  avg_final_price: number;
  avg_margin: number;
  latest_quotes: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bIData, setBIData] = useState<{ revenue: any[], conversion: any[] }>({ revenue: [], conversion: [] });
  const [config, setConfig] = useState<any>(null);
  const [filaments, setFilaments] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const userRole = (session?.user as any)?.role || "operador";
  const isAdmin = userRole === "admin";
  const isOperator = userRole === "operador";
  const canSeeFinancials = userRole === "admin" || userRole === "vendedor";

  useEffect(() => {
    fetch("/api/quotes")
      .then((r) => r.json())
      .then((data) => {
        const quotes = Array.isArray(data) ? data : [];
        const total = quotes.length;
        const avg = quotes.reduce((s: number, q: any) => s + Number(q.final_price_per_unit), 0) / (total || 1);
        const avgMargin = quotes.reduce((s: number, q: any) => s + Number(q.profit_margin_pct), 0) / (total || 1);

        // BI calculations
        const revenueByPrinter: Record<string, number> = {};
        const statusCounts: Record<string, number> = {};
        let totalRevenue = 0;

        quotes.forEach((q: any) => {
          // Status counts for Pie Chart
          statusCounts[q.status] = (statusCounts[q.status] || 0) + 1;

          // Revenue calculations (only for positive statuses)
          if (["approved", "in_production", "delivered"].includes(q.status)) {
            const price = Number(q.final_price);
            totalRevenue += price;
            revenueByPrinter[q.printer_name] = (revenueByPrinter[q.printer_name] || 0) + price;
          }
        });

        const revenueData = Object.entries(revenueByPrinter).map(([printerName, revenue]) => ({
          printerName,
          revenue: Number(revenue.toFixed(2))
        })).sort((a, b) => b.revenue - a.revenue);

        const conversionData = Object.entries(statusCounts).map(([status, count]) => {
          const info = getStatusInfo(status);
          return { status: info.label, count, color: info.color };
        }).sort((a, b) => b.count - a.count);

        setStats({ total_quotes: total, avg_final_price: avg, avg_margin: avgMargin, latest_quotes: quotes.slice(0, 10) });
        setBIData({ revenue: revenueData, conversion: conversionData });
      });
    fetch("/api/config").then((r) => r.json()).then(setConfig);
    fetch("/api/filaments").then((r) => r.json()).then(setFilaments);
    fetch("/api/printers").then((r) => r.json()).then(setPrinters);
    fetch("/api/quote-requests")
      .then((r) => r.json())
      .then((d) => setRequests(Array.isArray(d) ? d : []))
      .catch(() => setRequests([]));
  }, []);

  const fmt = (v: number) =>
    v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00";

  const totalExpectedRevenue = bIData.revenue.reduce((acc: any, curr: any) => acc + curr.revenue, 0);
  const criticalFilaments = filaments.filter(f => f.active && Number(f.current_weight_g) <= Number(f.min_stock_warning));
  const maintenancePrinters = printers.filter(p => p.active && (Number(p.current_hours_printed || 0) - Number(p.last_maintenance_hours || 0)) >= Number(p.maintenance_alert_threshold || 200));
  const pendingReqs = Array.isArray(requests) ? requests.filter(r => r.status === 'pending') : [];

  const cards = [
    { label: "Cotações Totais", value: stats?.total_quotes ?? "0", icon: "📋", color: "#3b82f6" },
  ];

  if (canSeeFinancials) {
    cards.unshift({ label: "Faturamento Aberto", value: fmt(totalExpectedRevenue), icon: "💼", color: "#6c63ff" });
    cards.push(
      { label: "Ticket médio / peça", value: fmt(stats?.avg_final_price || 0), icon: "💰", color: "#22c55e" },
      { label: "Margem média", value: `${(stats?.avg_margin || 0).toFixed(1)}%`, icon: "📈", color: "#f59e0b" }
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
        </p>
      </div>

      {criticalFilaments.length > 0 && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--red)", color: "white", padding: "1rem", borderRadius: "12px", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "1.5rem" }}>⚠️</div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fca5a5" }}>Estoque Crítico de Filamento</h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#fecaca" }}>
              {criticalFilaments.length === 1
                ? `O filamento "${criticalFilaments[0].name}" atingiu o nível crítico de ${Number(criticalFilaments[0].min_stock_warning).toFixed(0)}g.`
                : `${criticalFilaments.length} filamentos estão com estoque crítico.`}
            </p>
          </div>
          <Link href="/admin/estoque" style={{ marginLeft: "auto", background: "var(--red)", padding: "0.5rem 1rem", borderRadius: "8px", color: "white", textDecoration: "none", fontWeight: 600, fontSize: "0.875rem" }}>
            Repor Estoque →
          </Link>
        </div>
      )}

      {maintenancePrinters.length > 0 && (
        <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid #f59e0b", color: "white", padding: "1rem", borderRadius: "12px", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "1.5rem" }}>⚙️</div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fcd34d" }}>Manutenção de Impressora Pendente</h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#fef3c7" }}>
              {maintenancePrinters.length === 1
                ? `A impressora "${maintenancePrinters[0].name}" atingiu o limite de horas e precisa de manutenção preventiva.`
                : `${maintenancePrinters.length} impressoras precisam de manutenção preventiva.`}
            </p>
          </div>
          <Link href="/impressoras" style={{ marginLeft: "auto", background: "#f59e0b", padding: "0.5rem 1rem", borderRadius: "8px", color: "white", textDecoration: "none", fontWeight: 600, fontSize: "0.875rem" }}>
            Ver Impressoras →
          </Link>
        </div>
      )}

      {pendingReqs.length > 0 && (
        <div style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid var(--blue)", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "1.5rem" }}>📥</div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--blue)" }}>Novas Solicitações de Clientes</h3>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text)" }}>
                  Você tem {pendingReqs.length} arquivo(s) 3D aguardando precificação.
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-main)", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ background: "transparent" }}>Cliente</th>
                  <th style={{ background: "transparent" }}>Arquivo</th>
                  <th style={{ background: "transparent" }}>Material</th>
                  <th style={{ background: "transparent" }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendingReqs.slice(0, 5).map(r => (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight: 600 }}>{r.client_name}</div></td>
                    <td>
                      <a href={r.file_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline", fontSize: "0.875rem" }}>
                        {r.file_url.split('/').pop()}
                      </a>
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>{r.material_preference} – {r.color_preference}</td>
                    <td>
                      <Link href={`/cotacoes/nova?request_id=${r.id}`} className="btn btn-primary" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        Gerar Orçamento
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {cards.map((c) => (
          <KPICard key={c.label} title={c.label} value={c.value.toString()} icon={c.icon} color={c.color} />
        ))}
      </div>

      {/* BI Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: canSeeFinancials ? "2fr 1fr" : "1fr", gap: "1.25rem", marginBottom: "2rem" }}>
        {canSeeFinancials && <RevenueChart data={bIData.revenue} />}
        <StatusPieChart data={bIData.conversion} />
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr" : "1fr", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/cotacoes/nova" style={{ textDecoration: "none" }}>
          <div
            className="card"
            style={{
              cursor: "pointer",
              background: "linear-gradient(135deg, #6c63ff22, #6c63ff11)",
              borderColor: "#6c63ff44",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>➕</div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>Nova Cotação</div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              Calcular preço de uma peça
            </div>
          </div>
        </Link>
        {isAdmin && (
          <Link href="/configuracoes" style={{ textDecoration: "none" }}>
            <div
              className="card"
              style={{
                cursor: "pointer",
                background: "linear-gradient(135deg, #ff658422, #ff658411)",
                borderColor: "#ff658444",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚙️</div>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>Configurações</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                Energia, mão de obra, margem
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Latest quotes */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Últimas Cotações</h2>
          <Link href="/cotacoes" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none" }}>
            Ver todas →
          </Link>
        </div>
        {stats?.latest_quotes?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Cliente</th>
                  <th>Impressora</th>
                  {canSeeFinancials && <th>Preço/un</th>}
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.latest_quotes.map((q: any) => {
                  const st = getStatusInfo(q.status);
                  return (
                    <tr key={q.id}>
                      <td style={{ color: "var(--muted)" }}>#{q.id}</td>
                      <td>
                        <Link href={`/cotacoes/${q.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                          {q.title || "Sem título"}
                        </Link>
                      </td>
                      <td>{q.client_name || <span style={{ color: "var(--muted)" }}>Avulso</span>}</td>
                      <td>{q.printer_name}</td>
                      {canSeeFinancials && (
                        <td style={{ color: "var(--green)", fontWeight: 700 }}>
                          {Number(q.final_price_per_unit).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                      )}
                      <td>
                        <div style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: `${st.color}22`, color: st.color }}>
                          {st.icon} {st.label}
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                        {new Date(q.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem 0" }}>
            Nenhuma cotação ainda.{" "}
            <Link href="/cotacoes/nova" style={{ color: "var(--accent)" }}>
              Criar a primeira →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
