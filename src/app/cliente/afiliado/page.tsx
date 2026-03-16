"use client";

import { useEffect, useState } from "react";
import { Copy, Gift, DollarSign, Users, Ticket, CheckCircle2, CopyCheck } from "lucide-react";

export default function AffiliatePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/cliente/afiliado")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Carregando painel de afiliado...</div>;

  if (data?.not_found) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Quase lá!</h2>
        <p style={{ color: "var(--muted)" }}>{data.message}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: "1rem" }}>Atualizar Página</button>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/cliente/cadastro?ref=${data.referral_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const fmt = (val: any) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
            Programa de Indicação <span style={{ color: "var(--accent)" }}>brcprint</span>
          </h1>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Indique novos clientes e ganhe comissões em dinheiro por cada pedido aprovado!
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--accent)" }}>Taxa de Comissão</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{Number(data.commission_rate_pct).toFixed(1)}%</div>
        </div>
      </header>

      {/* Link de Indicação */}
      <div className="card" style={{ padding: "2rem", marginBottom: "2rem", background: "linear-gradient(135deg, var(--surface) 0%, rgba(108, 99, 255, 0.05) 100%)", border: "1px solid rgba(108, 99, 255, 0.2)" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Gift size={20} color="var(--accent)" /> Seu Link Único de Indicação
        </h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input
            type="text"
            readOnly
            value={referralLink}
            style={{
              flex: 1, padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)",
              background: "var(--surface2)", color: "var(--text)", fontSize: "1rem", fontWeight: 600
            }}
          />
          <button
            onClick={handleCopy}
            className="btn btn-primary"
            style={{ padding: "1rem 2rem", height: "100%", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "1rem", minWidth: 160, justifyContent: "center" }}
          >
            {copied ? <><CopyCheck size={20} /> Copiado!</> : <><Copy size={20} /> Copiar Link</>}
          </button>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "1rem", margin: "1rem 0 0" }}>
          Compartilhe este link com seus amigos ou clientes. Quando eles se cadastrarem e fecharem orçamentos, você ganha <b>{Number(data.commission_rate_pct).toFixed(1)}%</b> do valor total da peça!
        </p>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "var(--muted)" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>Indicações</span>
            <Users size={18} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900 }}>{data.total_referrals}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>Clientes Cadastrados</div>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "var(--muted)" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>Aguardando</span>
            <Ticket size={18} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#eab308" }}>{fmt(data.pending_earnings)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>Pedidos não finalizados</div>
        </div>

        <div className="card" style={{ padding: "1.5rem", border: "2px solid #22c55e", background: "rgba(34, 197, 94, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "#16a34a" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase" }}>Sacar Agora</span>
            <DollarSign size={18} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#16a34a" }}>{fmt(data.available_earnings)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>Pronto para envio via PIX</div>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "var(--muted)" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>Já Recebido</span>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900 }}>{fmt(data.paid_earnings)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>Total pago na sua conta</div>
        </div>
      </div>

      {/* Histórico */}
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Últimas Comissões Geradas</h2>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {data.history && data.history.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
              <tr>
                <th style={{ padding: "1rem", color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Data</th>
                <th style={{ padding: "1rem", color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Pedido</th>
                <th style={{ padding: "1rem", color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "1rem", color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase", textAlign: "right" }}>Valor R$</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((h: any) => (
                <tr key={h.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{new Date(h.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--accent)", fontWeight: 600 }}>#{h.public_token?.substring(0, 8) || "Indef"}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase",
                      background: h.status === 'paid' ? '#dcfce7' : h.status === 'available' ? '#fef08a' : h.status === 'cancelled' ? '#fee2e2' : 'var(--surface2)',
                      color: h.status === 'paid' ? '#166534' : h.status === 'available' ? '#a16207' : h.status === 'cancelled' ? '#991b1b' : 'var(--text)'
                    }}>
                      {h.status === 'pending' ? 'Ped. Pendente' : h.status === 'available' ? 'Liberado' : h.status === 'paid' ? 'Pago' : 'Cancelado'}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "1rem", fontWeight: 700, textAlign: "right" }}>
                    {fmt(h.commission_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            Nenhuma comissão gerada ainda. Compartilhe seu link para começar a ganhar!
          </div>
        )}
      </div>
    </div>
  );
}
