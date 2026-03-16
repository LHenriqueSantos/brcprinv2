export const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  // ──── Cotações (Quotes) ────
  pending: { label: "Aguardando Análise", color: "#f59e0b", icon: "⏳" },
  quoted: { label: "Orçamento Disponível", color: "#6c63ff", icon: "📄" },
  counter_offer: { label: "Contraproposta", color: "#a78bfa", icon: "💬" },
  approved: { label: "Cotação Aprovada", color: "#22c55e", icon: "✅" },
  awaiting_payment: { label: "Aguard. Pagamento", color: "#fb923c", icon: "💳" },
  in_production: { label: "Em Produção", color: "#3b82f6", icon: "⚙️" },
  production: { label: "Em Produção", color: "#3b82f6", icon: "⚙️" }, // Agregador para Dashboard
  delivered: { label: "Entregue", color: "#8b5cf6", icon: "📦" },
  rejected: { label: "Rejeitada", color: "#ff6584", icon: "❌" },
  cancelled: { label: "Cancelada", color: "#ef4444", icon: "🚫" },

  // ──── Pedidos do Carrinho (Cart Orders) ────
  pending_payment: { label: "Aguard. Pagamento", color: "#fb923c", icon: "💳" },
  paid: { label: "Pago", color: "#10b981", icon: "✅" },
  processing: { label: "Processando", color: "#3b82f6", icon: "⚙️" },
  shipped: { label: "Enviado", color: "#0ea5e9", icon: "🚚" },
  returned: { label: "Devolvido", color: "#f97316", icon: "↩️" },
};

export function getStatusInfo(status: string) {
  return STATUS_MAP[status] || { label: status, color: "#94a3b8", icon: "🏷️" };
}
