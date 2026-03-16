"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ClienteDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States para Formulários
  const [selectedPlanId, setSelectedPlanId] = useState<number | "">("");
  const [addHoursAmount, setAddHoursAmount] = useState<number>(0);
  const [addGramsAmount, setAddGramsAmount] = useState<number>(0);
  const [addHoursDesc, setAddHoursDesc] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      // Load plans
      const pRes = await fetch("/api/subscription-plans");
      setPlans(await pRes.json());

      // Load client details
      const cRes = await fetch(`/api/clients/${id}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setClient(cData);
        setSelectedPlanId(cData.subscription_plan_id || "");
      }

      // Load hour transactions
      const tRes = await fetch(`/api/clients/${id}/subscription`);
      if (tRes.ok) {
        setTransactions(await tRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleUpdatePlan = async () => {
    if (!confirm("Confirmar alteração de plano?")) return;
    try {
      await fetch(`/api/clients/${id}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_plan_id: selectedPlanId === "" ? null : selectedPlanId })
      });
      loadData();
    } catch (e) { console.error(e) }
  };

  const handleAddHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addHoursAmount === 0 && addGramsAmount === 0) return;
    if (!confirm(`Adicionar/Remover ${addHoursAmount}h e ${addGramsAmount}g do saldo?`)) return;

    try {
      await fetch(`/api/clients/${id}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add_hours: addHoursAmount, add_grams: addGramsAmount, description: addHoursDesc })
      });
      setAddHoursAmount(0);
      setAddGramsAmount(0);
      setAddHoursDesc("");
      loadData();
    } catch (e) { console.error(e) }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Carregando dados...</div>;
  if (!client) return <div style={{ padding: "2rem" }}>Cliente não encontrado.</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/clientes" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem", fontWeight: "bold" }}>← Voltar para Clientes</Link>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0.5rem 0 0" }}>{client.name}</h1>
        <p style={{ color: "var(--muted)", margin: "0.2rem 0 0" }}>{client.company || "Sem Empresa"} • {client.email}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Painel de Assinatura */}
        <div className="card" style={{ padding: "1.5rem", borderRadius: 12 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>Plano de Assinatura (B2B)</h2>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">Plano Vinculado</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select className="input" value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Nenhum / Avulso</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.monthly_price).toFixed(2)}/mês ({p.hours_included}h inclusas)</option>
                ))}
              </select>
              <button className="btn" style={{ background: "var(--accent)", color: "#000" }} onClick={handleUpdatePlan}>Salvar</button>
            </div>
          </div>

          <div style={{ padding: "1.5rem", background: "var(--surface2)", borderRadius: 8, display: "flex", justifyContent: "space-around", marginBottom: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Saldo de Horas</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>{Number(client.available_hours_balance).toFixed(1)} <span style={{ fontSize: "1rem" }}>h</span></div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)" }}></div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Saldo de Gramas</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>{Number(client.available_grams_balance).toFixed(0)} <span style={{ fontSize: "1rem" }}>g</span></div>
            </div>
          </div>

          <h3 style={{ fontSize: "1rem", marginTop: "2rem", marginBottom: "1rem" }}>Ajustar / Renovar Saldo</h3>
          <form onSubmit={handleAddHours} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label className="label">Qt. Horas (Ex: 50 ou -5)</label>
                <input required type="number" step="0.1" className="input" value={addHoursAmount} onChange={e => setAddHoursAmount(Number(e.target.value))} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Qt. Gramas (Ex: 1000)</label>
                <input required type="number" step="1" className="input" value={addGramsAmount} onChange={e => setAddGramsAmount(Number(e.target.value))} />
              </div>
            </div>
            <div style={{ flex: 1, marginTop: "0.5rem" }}>
              <label className="label">Descrição / Motivo</label>
              <input required type="text" className="input" placeholder="Ex: Renovação Mensal, Compra Extra" value={addHoursDesc} onChange={e => setAddHoursDesc(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-ghost" style={{ border: "1px solid var(--border)" }}>Executar Transação</button>
          </form>
        </div>

        {/* Historico de Transações */}
        <div className="card" style={{ padding: "1.5rem", borderRadius: 12 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>Extrato de Horas</h2>
          {transactions.length === 0 ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>Nenhuma transação registrada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 500, overflowY: "auto", paddingRight: "0.5rem" }}>
              {transactions.map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--surface2)", borderRadius: 8, borderLeft: `4px solid ${Number(t.hours_amount) > 0 ? 'var(--green)' : 'red'}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.description}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                      {new Date(t.created_at).toLocaleString("pt-BR")}
                      {t.quote_id && ` • Pedido #${t.quote_id} `}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", textAlign: "right" }}>
                    <div style={{ fontWeight: 800, color: Number(t.hours_amount) > 0 ? 'var(--green)' : 'red' }}>
                      {Number(t.hours_amount) > 0 ? '+' : ''}{Number(t.hours_amount).toFixed(1)}h
                    </div>
                    {(t.grams_amount > 0 || t.grams_amount < 0) && (
                      <div style={{ fontWeight: 800, color: Number(t.grams_amount) > 0 ? 'var(--green)' : 'red' }}>
                        {Number(t.grams_amount) > 0 ? '+' : ''}{Number(t.grams_amount).toFixed(0)}g
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
