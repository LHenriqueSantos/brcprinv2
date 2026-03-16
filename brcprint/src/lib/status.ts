export const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Aguardando Análise", color: "#f59e0b", icon: "⏳" },
  quoted: { label: "Orçamento Disponível", color: "#6c63ff", icon: "📄" },
  counter_offer: { label: "Contraproposta Recebida", color: "#6c63ff", icon: "💬" },
  approved: { label: "Cotação Aprovada", color: "#22c55e", icon: "✅" },
  awaiting_payment: { label: "Aguardando Pagamento", color: "#f59e0b", icon: "💳" },
  in_production: { label: "Em Produção", color: "#3b82f6", icon: "⚙️" },
  delivered: { label: "Entregue", color: "#8b5cf6", icon: "📦" },
  rejected: { label: "Rejeitada", color: "#ff6584", icon: "❌" },
};

export function getStatusInfo(status: string) {
  return STATUS_MAP[status] || { label: status, color: "#94a3b8", icon: "🏷️" };
}
