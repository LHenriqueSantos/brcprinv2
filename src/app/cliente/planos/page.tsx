"use client";

import { useEffect, useState } from "react";
import { Check, Info } from "lucide-react";

export default function ClientPlanosPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription-plans")
      .then(res => res.json())
      .then(data => {
        // filter active plans only
        setPlans(Array.isArray(data) ? data.filter(p => p.active) : []);
        setLoading(false);
      });
  }, []);

  const handleInterest = (planName: string) => {
    const text = `Olá! Gostaria de saber mais sobre a contratação do pacote B2B *${planName}* para a minha empresa.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}>Carregando pacotes disponíveis...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "1rem" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ display: "inline-block", background: "rgba(108, 99, 255, 0.1)", color: "var(--accent)", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem" }}>
          PARA EMPRESAS & FABRICANTES
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1rem" }}>
          Expanda sua produção com <span style={{ color: "var(--accent)" }}>Pacotes B2B</span>
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 600, margin: "0 auto" }}>
          Nossos pacotes incluem um limite de horas em máquinas profissionais e um reservatório de gramas dos melhores materiais (PLA, PETG, ABS), sempre garantindo a melhor precificação sem burocracia.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem" }}>
        {plans.map(plan => (
          <div key={plan.id} className="card hover-glow" style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column", borderTop: "6px solid var(--accent)", position: "relative", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", background: "linear-gradient(180deg, var(--surface) 0%, rgba(108, 99, 255, 0.03) 100%)", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--text)" }}>{plan.name}</h2>
              <div style={{ width: "40px", height: "4px", background: "var(--accent)", margin: "0.5rem auto", borderRadius: "4px" }} />
            </div>

            <div style={{ margin: "1rem 0 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-1px" }}>
                <span style={{ fontSize: "1.2rem", verticalAlign: "super", marginRight: "4px", color: "var(--muted)" }}>R$</span>
                {Number(plan.monthly_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span style={{ color: "var(--muted)", fontSize: "0.95rem", marginTop: "0.5rem", fontWeight: 600, textTransform: "uppercase" }}>/ mês</span>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "1rem", fontSize: "1.05rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                <div style={{ background: "rgba(108, 99, 255, 0.1)", padding: "0.4rem", borderRadius: "50%", display: "flex" }}>
                  <Check size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
                </div>
                <div style={{ lineHeight: 1.4 }}>
                  <strong style={{ display: "block", color: "var(--text)", fontSize: "1.1rem" }}>{Number(plan.hours_included)} Horas</strong>
                  <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Livre de Cobrança Adicional</span>
                </div>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "1rem", fontSize: "1.05rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                <div style={{ background: "rgba(108, 99, 255, 0.1)", padding: "0.4rem", borderRadius: "50%", display: "flex" }}>
                  <Check size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
                </div>
                <div style={{ lineHeight: 1.4 }}>
                  <strong style={{ display: "block", color: "var(--text)", fontSize: "1.1rem" }}>{Number(plan.grams_included)} Gramas</strong>
                  <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>De Custo de Material Embutido</span>
                </div>
              </li>
              {plan.b2b_filament_cost > 0 && (
                <li style={{ display: "flex", alignItems: "flex-start", gap: "1rem", fontSize: "0.95rem", color: "var(--muted)", background: "var(--surface2)", padding: "1rem", borderRadius: "8px" }}>
                  <Info size={18} color="var(--blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ lineHeight: 1.3 }}>Preço de atacado em Filamentos ({plan.filament_type || 'Geral'}):<br /><strong style={{ color: "var(--text)" }}>R$ {Number(plan.b2b_filament_cost).toFixed(2)}/kg</strong></span>
                </li>
              )}
            </ul>

            <button
              onClick={() => handleInterest(plan.name)}
              className="btn btn-primary"
              style={{ width: "100%", padding: "1.2rem", fontSize: "1.1rem", fontWeight: 800, borderRadius: "10px", textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 4px 14px rgba(108, 99, 255, 0.4)" }}
            >
              Assinar Agora
            </button>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
          Nenhum pacote B2B disponível no momento.
        </div>
      )}
    </div>
  );
}
