"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getStatusInfo } from "@/lib/status";
import KPICard from "@/components/KPICard";
import RevenueChart from "@/components/RevenueChart";
import StatusPieChart from "@/components/StatusPieChart";
import TopProductsCard from "@/components/TopProductsCard";

interface DashboardData {
  total_revenue: number;
  sales_by_status: any[];
  revenue_by_day: any[];
  top_selling_items: any[];
  latest_combined_orders: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [filaments, setFilaments] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const userRole = (session?.user as any)?.role || "operador";
  const isAdmin = userRole === "admin";
  const canSeeFinancials = userRole === "admin" || userRole === "vendedor";

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setDashboard(data);
      });

    fetch("/api/filaments").then((r) => r.json()).then(setFilaments);
    fetch("/api/printers").then((r) => r.json()).then(setPrinters);
    fetch("/api/quote-requests")
      .then((r) => r.json())
      .then((d) => setRequests(Array.isArray(d) ? d : []))
      .catch(() => setRequests([]));
  }, []);

  const fmt = (v: number) =>
    v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00";

  const criticalFilaments = filaments.filter(f => f.active && Number(f.current_weight_g) <= Number(f.min_stock_warning));
  const maintenancePrinters = printers.filter(p => p.active && (Number(p.current_hours_printed || 0) - Number(p.last_maintenance_hours || 0)) >= Number(p.maintenance_alert_threshold || 200));
  const pendingReqs = Array.isArray(requests) ? requests.filter(r => r.status === 'pending') : [];

  // Transform pie chart data colors
  const conversionData = (dashboard?.sales_by_status || []).map((s: any) => {
    const info = getStatusInfo(s.status);
    return { status: info.label, count: s.count, color: info.color };
  }).sort((a: any, b: any) => b.count - a.count);

  const totalOrdersCount = dashboard?.sales_by_status.reduce((acc, curr) => acc + Number(curr.count), 0) || 0;
  const avgTicket = totalOrdersCount > 0 ? (dashboard?.total_revenue || 0) / totalOrdersCount : 0;

  const cards = [
    { label: "Pedidos / Cotações", value: totalOrdersCount.toString(), icon: "📋", color: "#3b82f6" },
  ];

  if (canSeeFinancials) {
    cards.unshift({ label: "Faturamento Aberto", value: fmt(dashboard?.total_revenue || 0), icon: "💼", color: "#6c63ff" });
    cards.push(
      { label: "Ticket médio", value: fmt(avgTicket), icon: "💰", color: "#22c55e" },
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
          Visão unificada do negócio
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
        {canSeeFinancials && <RevenueChart data={dashboard?.revenue_by_day || []} />}
        <StatusPieChart data={conversionData} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: canSeeFinancials && dashboard?.top_selling_items?.length ? "2fr 1fr" : "1fr", gap: "1.25rem", marginBottom: "2rem" }}>
        {/* Latest Combined Orders Table */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Últimas Movimentações (Loja & Cotações)</h2>
          </div>
          {dashboard?.latest_combined_orders?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Tipo</th>
                    <th>Título</th>
                    {canSeeFinancials && <th>Total</th>}
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.latest_combined_orders.map((item: any, idx: number) => {
                    const st = getStatusInfo(item.status);
                    const isCart = item.source === 'cart';
                    return (
                      <tr key={idx}>
                        <td style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 700 }}>
                          {isCart ? `C-${item.id}` : `Q-${item.id}`}
                        </td>
                        <td>
                          {isCart ? '🛒 Online' : '⚙️ Cotação'}
                        </td>
                        <td>
                          <Link href={isCart ? `/admin/orders/${item.id}` : `/cotacoes/${item.id}`} style={{ color: isCart ? "var(--purple)" : "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                            {item.title || "Pedido S/ Nome"}
                          </Link>
                        </td>
                        {canSeeFinancials && (
                          <td style={{ color: "var(--green)", fontWeight: 700 }}>
                            {Number(item.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                        )}
                        <td>
                          <div style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: `${st.color}22`, color: st.color }}>
                            {st.icon} {st.label}
                          </div>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                          {new Date(item.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem 0" }}>
              Nenhuma movimentação recente.
            </p>
          )}
        </div>

        {/* Top Selling Store Items */}
        {canSeeFinancials && (dashboard?.top_selling_items?.length ?? 0) > 0 && dashboard?.top_selling_items && (
          <TopProductsCard products={dashboard.top_selling_items} />
        )}
      </div>

    </div>
  );
}
