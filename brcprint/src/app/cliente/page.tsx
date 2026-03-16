"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getStatusInfo } from "@/lib/status";

interface RequestItem {
  id: number;
  title?: string;
  file_url: string;
  public_token?: string;
  material_preference: string;
  color_preference: string;
  quantity: number;
  status: 'pending' | 'quoted' | 'rejected';
  final_price?: string;
  tax_amount?: string;
  shipping_cost?: string;
  quote_status?: string;
  created_at: string;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load Client Profile
    fetch("/api/clients/me").then(r => r.ok && r.json()).then(c => c && setClient(c)).catch(() => { });

    // Load Requests
    fetch("/api/client/orders")
      .then((r) => r.json())
      .then((d) => {
        setRequests(d || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);


  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Meus Orçamentos</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Olá, {(session?.user as any)?.name?.split(" ")[0]}! Que bom te ver por aqui.
          </p>
        </div>
        <Link href="/cliente/novo" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
          + Novo Pedido
        </Link>
      </div>

      {client && client.subscription_status === 'active' && (
        <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: 12, background: "linear-gradient(135deg, #f8fafc, #eff6ff)", border: "2px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>
              💎 Assinatura B2B: {client.plan_name || "Plano Ativo"}
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b", margin: 0, display: "flex", gap: "1rem" }}>
              <div>{Number(client.available_hours_balance).toFixed(1)} <span style={{ fontSize: "1rem", color: "#64748b" }}>h</span></div>
              <div style={{ color: "#cbd5e1" }}>|</div>
              <div>{Number(client.available_grams_balance).toFixed(0)} <span style={{ fontSize: "1rem", color: "#64748b" }}>g</span></div>
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#475569", margin: "0.5rem 0 0" }}>Seu saldo será deduzido automaticamente mediante sua aprovação.</p>
          </div>
          <div style={{ fontSize: "3rem" }}>💳</div>
        </div>
      )}

      {client && Number(client.credit_balance) > 0 && (
        <div className="card" style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          borderRadius: 12,
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          border: "2px solid #86efac",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>
              🪙 Saldo em Cashback
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#14532d", margin: 0 }}>
              {Number(client.credit_balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#166534", margin: "0.5rem 0 0", opacity: 0.8 }}>
              Use este saldo em sua próxima cotação para ganhar descontos!
            </p>
          </div>
          <div style={{ fontSize: "3rem" }}>🪙</div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Carregando seus pedidos...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "4rem 1rem", textAlign: "center", color: "var(--muted)" }}>
            <p style={{ fontSize: "3rem", margin: "0 0 1rem" }}>📦</p>
            <h3 style={{ margin: "0 0 0.5rem", color: "var(--text)" }}>Nenhum pedido ainda</h3>
            <p style={{ margin: 0 }}>Você ainda não enviou nenhum arquivo para orçamento.</p>
            <Link href="/cliente/novo" style={{ display: "inline-block", marginTop: "1.5rem", color: "var(--accent)", fontWeight: 600 }}>
              Enviar meu primeiro arquivo 3D →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Arquivo STL / DETALHES</th>
                  <th>Material / Cor</th>
                  <th>Qtd</th>
                  <th>Status</th>
                  <th>Preço do Pedido</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const s = getStatusInfo(r.status);
                  const canOpenPortal = !!r.public_token;

                  return (
                    <tr key={r.id}>
                      <td>
                        {canOpenPortal ? (
                          <Link href={`/portal/${r.public_token}`} style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700 }}>
                            {r.title || r.file_url.split('/').pop()}
                          </Link>
                        ) : (
                          <a href={r.file_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700 }}>
                            {r.title || r.file_url.split('/').pop()}
                          </a>
                        )}
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                          Enviado em {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.material_preference || "Qualquer"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{r.color_preference || "Não importa"}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.quantity} un</td>
                      <td>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "100px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          background: `${s.color}15`,
                          color: s.color,
                          border: `1px solid ${s.color}33`
                        }}>
                          {s.icon} {s.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: r.public_token ? "var(--green)" : "var(--muted)" }}>
                        {r.public_token && r.final_price
                          ? Number(Number(r.final_price) + Number(r.tax_amount || 0) + Number(r.shipping_cost || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : "Aguardando cálculo..."}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
