import React from "react";

interface TimelineProps {
  status: string;
}

const STEPS = [
  { id: "pending_quoted", label: "Orçado", match: ["pending", "quoted", "counter_offer"] },
  { id: "approved", label: "Aprovado", match: ["approved", "awaiting_payment"] },
  { id: "in_production", label: "Em Produção", match: ["in_production"] },
  { id: "delivered", label: "Finalizado", match: ["delivered"] },
];

export default function OrderTimeline({ status }: TimelineProps) {
  const isRejected = status === "rejected";

  // Find current step index
  let currentStepIndex = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].match.includes(status)) {
      currentStepIndex = i;
      break;
    }
  }

  // If delivered, mark all as complete. If approved, mark 0 and 1 as complete.
  // Actually, we can just say any step with index <= currentStepIndex is active/passed (unless rejected)

  return (
    <div style={{ padding: "1.5rem 1rem", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
      {isRejected ? (
        <div style={{ textAlign: "center", color: "#ff6584", fontWeight: 700, fontSize: "1.1rem" }}>
          ❌ Pedido Rejeitado / Cancelado
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          {/* Background line */}
          <div style={{ position: "absolute", top: 15, left: "10%", right: "10%", height: 3, background: "var(--border)", zIndex: 0, borderRadius: 2 }} />

          {/* Progress line */}
          <div style={{ position: "absolute", top: 15, left: "10%", width: `${(currentStepIndex / (STEPS.length - 1)) * 80}%`, height: 3, background: "var(--accent)", zIndex: 1, borderRadius: 2, transition: "width 0.4s ease-in-out" }} />

          {STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: isCompleted ? "var(--accent)" : "var(--surface2)",
                  border: `3px solid ${isCompleted ? "var(--accent)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isCompleted ? "#fff" : "var(--muted)",
                  fontWeight: 700, fontSize: "0.875rem",
                  transition: "all 0.3s ease",
                  boxShadow: isCurrent ? "0 0 0 4px rgba(108,99,255,0.2)" : "none"
                }}>
                  {isCompleted ? "✓" : (idx + 1)}
                </div>
                <div style={{
                  marginTop: "0.5rem", fontSize: "0.75rem", fontWeight: isCurrent ? 700 : 600,
                  color: isCompleted ? "var(--text)" : "var(--muted)",
                  textAlign: "center"
                }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
