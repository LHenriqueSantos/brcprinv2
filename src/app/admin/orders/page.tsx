"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  ArrowUpDown
} from "lucide-react";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error("API returned non-array data:", data);
        setOrders([]);
      }
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: any = {
    pending_payment: { label: "Pendente", color: "#f59e0b", icon: <Clock size={14} /> },
    paid: { label: "Pago", color: "#10b981", icon: <CheckCircle2 size={14} /> },
    processing: { label: "Produção", color: "#6366f1", icon: <Package size={14} /> },
    shipped: { label: "Enviado", color: "#3b82f6", icon: <Truck size={14} /> },
    delivered: { label: "Entregue", color: "#059669", icon: <CheckCircle2 size={14} /> },
    cancelled: { label: "Cancelado", color: "#ef4444", icon: <XCircle size={14} /> },
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      (o.client_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.id.toString().includes(searchTerm)) ||
      (o.client_email?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Pedidos do Carrinho</h1>
          <p style={{ color: "var(--muted)", margin: "0.5rem 0 0" }}>Gerencie os pedidos recebidos via checkout direto.</p>
        </div>
        <div style={{ background: "var(--surface2)", padding: "0.8rem 1.2rem", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <ShoppingBag size={20} color="var(--accent)" />
          <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{orders.length} Pedidos</span>
        </div>
      </header>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            className="input"
            style={{ paddingLeft: "2.8rem" }}
            placeholder="Buscar por cliente, ID ou e-mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface2)", padding: "0 1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <Filter size={16} color="var(--muted)" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--text)", padding: "0.5rem", outline: "none", fontWeight: 600 }}
          >
            <option value="all">Todos os Status</option>
            <option value="pending_payment">Pendente</option>
            <option value="paid">Pago</option>
            <option value="processing">Em Produção</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>Carregando pedidos...</div>
      ) : (
        <div style={{ background: "var(--surface2)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "rgba(0,0,0,0.05)", borderBottom: "1px solid var(--border)" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "1.2rem", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--muted)" }}>ID</th>
                <th style={{ textAlign: "left", padding: "1.2rem", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--muted)" }}>Cliente</th>
                <th style={{ textAlign: "left", padding: "1.2rem", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--muted)" }}>Data</th>
                <th style={{ textAlign: "left", padding: "1.2rem", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--muted)" }}>Itens</th>
                <th style={{ textAlign: "left", padding: "1.2rem", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--muted)" }}>Total</th>
                <th style={{ textAlign: "left", padding: "1.2rem", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                <th style={{ padding: "1.2rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} className="hover:bg-black/5">
                  <td style={{ padding: "1.2rem", fontWeight: 700 }}>#{order.id}</td>
                  <td style={{ padding: "1.2rem" }}>
                    <div style={{ fontWeight: 700 }}>{order.client_name || "Convidado"}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{order.client_email}</div>
                  </td>
                  <td style={{ padding: "1.2rem", fontSize: "0.9rem" }}>
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: "1.2rem" }}>
                    <span style={{ padding: "0.3rem 0.6rem", background: "var(--surface1)", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600 }}>
                      {order.item_count} itens
                    </span>
                  </td>
                  <td style={{ padding: "1.2rem", fontWeight: 800, color: "var(--accent)" }}>
                    R$ {Number(order.total).toFixed(2)}
                  </td>
                  <td style={{ padding: "1.2rem" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      width: "fit-content",
                      background: `${statusMap[order.status]?.color}15`,
                      color: statusMap[order.status]?.color
                    }}>
                      {statusMap[order.status]?.icon}
                      {statusMap[order.status]?.label}
                    </div>
                  </td>
                  <td style={{ padding: "1.2rem", textAlign: "right" }}>
                    <Link href={`/admin/orders/${order.id}`} style={{ color: "var(--muted)" }}>
                      <ChevronRight size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
              Nenhum pedido encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
