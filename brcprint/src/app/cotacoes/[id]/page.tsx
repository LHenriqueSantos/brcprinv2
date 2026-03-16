"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStatusInfo } from "@/lib/status";
import ModelViewer from "@/components/ModelViewer";
import OrderTimeline from "@/components/OrderTimeline";
import ChatBox from "@/components/ChatBox";

export default function CotacaoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [q, setQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Consumables state
  const [availableConsumables, setAvailableConsumables] = useState<any[]>([]);
  const [quoteConsumables, setQuoteConsumables] = useState<any[]>([]);
  const [selectedCons, setSelectedCons] = useState("");
  const [consQuantity, setConsQuantity] = useState("");
  const [isAddingCons, setIsAddingCons] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const fetchQuoteData = () => {
    Promise.all([
      fetch(`/api/quotes/${id}`).then(r => r.json()),
      fetch(`/api/quotes/${id}/consumables`).then(r => r.json().catch(() => [])),
      fetch("/api/consumables").then(r => r.json().catch(() => []))
    ]).then(([quoteData, qcData, cData]) => {
      setQ(quoteData);
      setQuoteConsumables(Array.isArray(qcData) ? qcData : []);
      setAvailableConsumables(Array.isArray(cData) ? cData : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuoteData();
  }, [id]);

  const handleAddConsumable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCons || !consQuantity) return;
    setIsAddingCons(true);

    const res = await fetch(`/api/quotes/${id}/consumables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumable_id: Number(selectedCons),
        quantity_used: Number(consQuantity)
      })
    });

    if (res.ok) {
      setSelectedCons("");
      setConsQuantity("");
      fetchQuoteData(); // Recalculate everything
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao adicionar insumo.");
    }
    setIsAddingCons(false);
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pct = (v: number) => `${Number(v).toFixed(2)}%`;

  const copyLink = () => {
    if (!q?.public_token) return;
    const url = `${window.location.origin}/portal/${q.public_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const [deliveredModal, setDeliveredModal] = useState<boolean>(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showInShowroom, setShowInShowroom] = useState(false);
  const [uploading, setUploading] = useState(false);

  const updateStatus = async (newStatus: string, resultPhotoUrl?: string) => {
    const res = await fetch(`/api/quotes/${q.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, resultPhotoUrl, showInShowroom }),
    });
    if (res.ok) {
      setQ({ ...q, status: newStatus, result_photo_url: resultPhotoUrl || q.result_photo_url });
    } else {
      alert("Erro ao atualizar status");
    }
  };

  const submitDelivered = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalPhotoUrl = "";
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const ud = await uploadRes.json();
          finalPhotoUrl = ud.url;
        }
      }
      await updateStatus("delivered", finalPhotoUrl);
      setDeliveredModal(false);
    } catch (error) {
      alert("Erro ao marcar como entregue e notificar");
    }
    setUploading(false);
  };

  const acceptCounterOffer = async () => {
    if (!confirm(`Aceitar a contraproposta de ${Number(q.counter_offer_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por peça? O cliente será notificado para aprovar e pagar.`)) return;
    const res = await fetch(`/api/quotes/${q.id}/accept-counter-offer`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setQ({ ...q, status: 'quoted', final_price: data.final_price, final_price_per_unit: data.final_price_per_unit });
    } else {
      alert(data.error || "Erro ao aceitar contraproposta.");
    }
  };

  const deleteQuote = async () => {
    if (!confirm(`Excluir a cotação "${q.title || '#' + q.id}"? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/quotes/${q.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/cotacoes");
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir cotação.");
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm("Confirmar recebimento de pagamento para esta cotação?")) return;
    const res = await fetch(`/api/admin/quotes/${q.id}/pay`, { method: "POST" });
    if (res.ok) {
      fetchQuoteData(); // Refresh to show paid badge and updated status
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao marcar como pago.");
    }
  };

  if (loading) return <div style={{ color: "var(--muted)", padding: "2rem" }}>Carregando…</div>;
  if (!q) return <div style={{ color: "var(--muted)", padding: "2rem" }}>Cotação não encontrada.</div>;

  const status = getStatusInfo(q.status || "pending");

  const CostRow = ({ icon, label, value, pctLabel, accent }: any) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <span style={{ marginRight: "0.5rem" }}>{icon}</span>
        <span style={{ fontSize: "0.875rem", color: accent ? "var(--text)" : "var(--muted)" }}>{label}</span>
        {pctLabel && <span style={{ fontSize: "0.7rem", color: "var(--muted)", marginLeft: "0.5rem" }}>({pctLabel})</span>}
      </div>
      <span style={{ fontWeight: 700, color: accent ? "var(--accent)" : "var(--text)" }}>{value}</span>
    </div>
  );

  const contribution = (v: number) => q.cost_total_production > 0 ? `${((v / q.cost_total_production) * 100).toFixed(1)}% do custo` : "–";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/cotacoes" style={{ color: "var(--muted)", fontSize: "0.85rem", textDecoration: "none" }}>← Voltar ao Histórico</Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
              {q.title || "Cotação sem título"} <span style={{ color: "var(--muted)", fontWeight: 400 }}>#{q.id}</span>
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
              Gerada em {new Date(q.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          {/* Status Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: 999, background: `${status.color}22`, border: `1px solid ${status.color}44` }}>
              <span>{status.icon}</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: status.color }}>{status.label}</span>
            </div>
            {q.is_paid && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: 999, background: `#22c55e22`, border: `1px solid #22c55e44` }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#22c55e" }}>💰 PAGO</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {q.config?.enable_timeline && (
        <OrderTimeline status={q.status || "pending"} />
      )}

      {/* Counter offer banner */}
      {q.status === "counter_offer" && (
        <div className="card" style={{ marginBottom: "1.5rem", borderColor: "#6c63ff55", background: "#6c63ff11" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: "#6c63ff", fontSize: "0.9rem", fontWeight: 700 }}>💬 Contraproposta do Cliente</h3>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Valor proposto por peça</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#6c63ff" }}>{fmt(q.counter_offer_price)}</div>
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--muted)", maxWidth: 400 }}>
              {q.counter_offer_notes || "Sem justificativa informada"}
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>
            Respondido em: {q.responded_at ? new Date(q.responded_at).toLocaleString("pt-BR") : "–"}
          </div>
        </div>
      )}

      {/* Actions row */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>

        {/* Production Flow Actions */}
        {!q.is_paid && <button className="btn" onClick={handleMarkAsPaid} style={{ background: "#f59e0b", color: "#fff", border: "none" }}>💸 Marcar como Paga</button>}
        {(q.status === "pending" || q.status === "quoted") && <button className="btn" onClick={() => updateStatus("approved")} style={{ background: "#22c55e", color: "#fff", border: "none" }}>✅ Aprovar Manualmente</button>}
        {q.status === "awaiting_payment" && <button className="btn" onClick={() => updateStatus("approved")} style={{ background: "#f59e0b", color: "#fff", border: "none" }}>💳 Confirmar Pagamento Recebido</button>}
        {q.status === "counter_offer" && (
          <button className="btn" onClick={acceptCounterOffer} style={{ background: "#6c63ff", color: "#fff", border: "none" }}>
            💬 Aceitar Proposta do Cliente
          </button>
        )}
        {q.status === "counter_offer" && (
          <button className="btn btn-ghost" onClick={() => updateStatus("quoted")} style={{ border: "1px solid #6c63ff55" }}>
            🔁 Recusar e Manter Preço
          </button>
        )}
        {q.status === "approved" && <button className="btn" onClick={() => updateStatus("in_production")} style={{ background: "#3b82f6", color: "#fff", border: "none" }}>⚙️ Iniciar Produção</button>}
        {q.status === "in_production" && <button className="btn" onClick={() => setDeliveredModal(true)} style={{ background: "#8b5cf6", color: "#fff", border: "none" }}>📦 Marcar Entregue</button>}

        <button className="btn btn-ghost" onClick={copyLink}>
          {copied ? "✅ Link copiado!" : "🔗 Copiar link"}
        </button>
        <a href={`/api/quotes/${q.id}/pdf`} target="_blank" rel="noreferrer">
          <button className="btn btn-ghost">📄 PDF Comercial</button>
        </a>
        <a href={`/api/quotes/${q.id}/label`} target="_blank" rel="noreferrer">
          <button className="btn btn-ghost" style={{ background: "#f1f5f9", color: "#1e293b", border: "1px solid #cbd5e1" }}>🏷️ Etiqueta 100x150</button>
        </a>
        <Link href={`/cotacoes/nova?duplicate=${q.id}`}>
          <button className="btn btn-ghost">🔁 Duplicar</button>
        </Link>
        {q.public_token && (
          <a href={`/portal/${q.public_token}`} target="_blank" rel="noreferrer">
            <button className="btn btn-ghost">👁️ Portal</button>
          </a>
        )}
        <button
          onClick={deleteQuote}
          style={{ marginLeft: "auto", background: "transparent", border: "1px solid #ef444455", color: "#ef4444", borderRadius: 8, padding: "0.45rem 1rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}
        >
          🗑️ Excluir
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Print info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {q.config?.enable_3d_viewer && (q.file_url || q.file_urls) && (
            <div className="card" style={{ padding: "0", marginBottom: "1.5rem", overflow: "hidden" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>🧊 Visualização 3D</h2>
                {(q.file_urls ? (typeof q.file_urls === 'string' ? JSON.parse(q.file_urls) : q.file_urls) : [q.file_url]).length > 1 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700 }}>
                    {selectedFileIndex + 1} / {(q.file_urls ? (typeof q.file_urls === 'string' ? JSON.parse(q.file_urls) : q.file_urls) : [q.file_url]).length} arquivos
                  </div>
                )}
              </div>

              <div style={{ height: 400, position: "relative", background: "var(--surface)" }}>
                <ModelViewer
                  url={(q.file_urls ? (typeof q.file_urls === 'string' ? JSON.parse(q.file_urls) : q.file_urls) : [q.file_url])[selectedFileIndex]}
                  color="#6c63ff"
                  materialType={q.filament_type}
                />
              </div>

              {/* File Selector & Download Section */}
              <div style={{ padding: "0.75rem", background: "var(--surface2)", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(q.file_urls ? (typeof q.file_urls === 'string' ? JSON.parse(q.file_urls) : q.file_urls) : [q.file_url]).map((url: string, idx: number) => {
                    const fileName = url.split('/').pop()?.split('-').slice(1).join('-') || url.split('/').pop();
                    const isSelected = selectedFileIndex === idx;
                    return (
                      <div key={idx} style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        background: isSelected ? "var(--surface)" : "rgba(0,0,0,0.03)",
                        border: isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                        transition: "all 0.2s"
                      }}>
                        <div
                          onClick={() => setSelectedFileIndex(idx)}
                          style={{
                            flex: 1,
                            cursor: "pointer",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.8rem",
                            fontWeight: isSelected ? 700 : 400,
                            color: isSelected ? "var(--accent)" : "var(--text)"
                          }}
                          title={fileName}
                        >
                          {isSelected ? "👁️ " : "📄 "}{fileName}
                        </div>
                        <a
                          href={url}
                          download={fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem", marginLeft: "0.5rem" }}
                          title="Download"
                        >
                          📥
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem" }}>📋 Parâmetros Globais</h2>
            {[
              ["🖨️ Tecnologia", `${q.printer_name}${q.printer_model ? ` (${q.printer_model})` : ""}`],
              ["🧵 Material", `${q.filament_name} (${q.filament_type}) - ${q.filament_color || "N/A"}`],
              ["⏱️ Tempo impressão", `${q.print_time_hours}h`],
              ["⚖️ Consumo Material", `${q.filament_used_g}g`],
              ["👷 Setup", `${q.setup_time_hours}h`],
              ["🔄 Pós-proc.", `${q.post_process_hours}h`],
              ["📦 Quantidade Lote", `${q.quantity} unidade(s)`],
              ["📅 Válida até", q.valid_until ? new Date(q.valid_until).toLocaleDateString("pt-BR") : `${q.valid_days || 30} dias`],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.875rem", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted)" }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v as string}</span>
              </div>
            ))}
            {q.notes && <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--surface2)", borderRadius: 8, fontSize: "0.8rem", color: "var(--muted)" }}>{q.notes}</div>}
          </div>

          {q.items && (
            <div className="card" style={{ padding: "0" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>🧩 Peças da Montagem</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface2)", color: "var(--muted)" }}>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Arquivo</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Material</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Preenchimento</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Qtd</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Custo Lote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(typeof q.items === 'string' ? JSON.parse(q.items) : q.items).map((item: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{item.material} <span style={{ opacity: 0.5 }}>{item.color}</span></td>
                        <td style={{ padding: "0.75rem 1rem" }}>{item.infill}%</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{item.quantity} un</td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--accent)" }}>{item._calc ? fmt(item._calc.total_price) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Client + config */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Client card */}
          {q.client_name ? (
            <div className="card">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem" }}>👤 Cliente</h2>
              {[
                ["Nome", q.client_name],
                ["Empresa", q.client_company],
                ["E-mail", q.client_email],
                ["Telefone", q.client_phone],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.875rem", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--muted)" }}>{l}</span>
                  {l === "E-mail"
                    ? <a href={`mailto:${v}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{v as string}</a>
                    : <span style={{ fontWeight: 600 }}>{v as string}</span>
                  }
                </div>
              ))}
              {/* Portal link preview */}
              <div style={{ marginTop: "0.75rem", padding: "0.6rem", background: "var(--surface2)", borderRadius: 8, fontSize: "0.7rem", color: "var(--muted)", wordBreak: "break-all" }}>
                🔗 {typeof window !== "undefined" ? window.location.origin : ""}/portal/{q.public_token}
              </div>
            </div>
          ) : (
            <div className="card" style={{ borderStyle: "dashed" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0, textAlign: "center" }}>
                Nenhum cliente vinculado a esta cotação.
              </p>
            </div>
          )}

          {/* Delivery Info */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem" }}>📍 Dados de Entrega</h2>
            {q.client_zipcode || q.client_address ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                {q.client_name && <div><strong>Recebedor:</strong> {q.client_name}</div>}
                {q.client_document && <div><strong>Doc (CPF/CNPJ):</strong> {q.client_document}</div>}
                <div style={{ marginTop: "0.5rem" }}>
                  {q.client_address ? (
                    <>
                      {q.client_address}, {q.client_address_number} {q.client_address_comp ? ` - ${q.client_address_comp}` : ""}<br />
                      {q.client_neighborhood} - {q.client_city}/{q.client_state}<br />
                      CEP: {q.client_zipcode}
                    </>
                  ) : (
                    <span>CEP Informado (Legado): {q.client_zipcode}</span>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
                Nenhum endereço informado. (Retirada no Local)
              </p>
            )}
          </div>

          {/* Config snapshot */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem" }}>⚙️ Config. Utilizada</h2>
            {[
              ["⚡ R$/kWh", `R$ ${Number(q.energy_kwh_price).toFixed(4)}`],
              ["👷 Mão de obra", `${fmt(q.labor_hourly_rate)}/h`],
              ["📈 Margem", pct(q.profit_margin_pct)],
              ["📉 Perdas", pct(q.loss_pct)],
              ["🔩 Reposição", pct(q.spare_parts_pct)],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.875rem", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted)" }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Result Photo if it exists */}
        {q.result_photo_url && (
          <div className="card" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem" }}>📸 Foto do Resultado (UGC)</h2>
            <a href={q.result_photo_url} target="_blank" rel="noreferrer">
              <img src={q.result_photo_url} alt="Proof of Work" style={{ width: "100%", borderRadius: "8px", objectFit: "cover", display: "block", maxHeight: "400px" }} />
            </a>
          </div>
        )}
      </div>

      {/* Cost breakdown */}
      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem" }}>💰 Composição de Custos</h2>
        <CostRow icon="🧵" label="Filamento (inclui perdas)" value={fmt(q.cost_filament)} pctLabel={contribution(q.cost_filament)} />
        <CostRow icon="⚡" label="Energia elétrica" value={fmt(q.cost_energy)} pctLabel={contribution(q.cost_energy)} />
        <CostRow icon="📉" label="Depreciação da impressora" value={fmt(q.cost_depreciation)} pctLabel={contribution(q.cost_depreciation)} />
        <CostRow icon="🔧" label="Reserva para manutenção" value={fmt(q.cost_maintenance)} pctLabel={contribution(q.cost_maintenance)} />
        <CostRow icon="👷" label="Mão de obra" value={fmt(q.cost_labor)} pctLabel={contribution(q.cost_labor)} />
        <CostRow icon="🔩" label="Reserva peças de reposição" value={fmt(q.cost_spare_parts)} pctLabel={contribution(q.cost_spare_parts)} />

        <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--surface2)", borderRadius: 10 }}>
          {quoteConsumables.length > 0 && (
            <div style={{ marginBottom: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border)" }}>
              <CostRow icon="🎨" label="Insumos Extras (Tintas, Colas, etc)" value={`+ ${fmt(quoteConsumables.reduce((a, c) => a + Number(c.cost_recorded), 0))}`} />
              {quoteConsumables.map((qc, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", paddingLeft: "1.5rem", marginTop: "0.25rem" }}>
                  <span>{qc.quantity_used} {qc.unit_type} x {qc.name}</span>
                  <span>{fmt(Number(qc.cost_recorded))}</span>
                </div>
              ))}
            </div>
          )}
          <CostRow icon="📊" label="Custo total de produção" value={fmt(q.cost_total_production)} accent />
          <CostRow icon="📈" label={`Margem de lucro (${pct(q.profit_margin_pct)})`} value={`+ ${fmt(q.profit_value)}`} />
        </div>

        {/* Adicionar Insumos Extras */}
        {q.status !== "delivered" && (
          <div style={{ marginTop: "1rem", padding: "1rem", border: "1px dashed var(--border)", borderRadius: 10 }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>📦 Adicionar Insumo à Produção</div>
            <form onSubmit={handleAddConsumable} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ fontSize: "0.75rem" }}>Insumo</label>
                <select className="input" value={selectedCons} onChange={e => setSelectedCons(e.target.value)} required style={{ padding: "0.4rem 0.6rem", fontSize: "0.875rem", height: "32px" }}>
                  <option value="">Selecione...</option>
                  {availableConsumables.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.unit_type}) - R$ {Number(c.cost_per_unit).toFixed(2)}/un
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: "90px" }}>
                <label className="label" style={{ fontSize: "0.75rem" }}>Qtd</label>
                <input type="number" step="0.01" className="input" placeholder="Ex: 2" value={consQuantity} onChange={e => setConsQuantity(e.target.value)} required style={{ padding: "0.4rem 0.6rem", fontSize: "0.875rem", height: "32px" }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isAddingCons || !selectedCons} style={{ padding: "0 1rem", height: "32px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                {isAddingCons ? "Adicionando..." : "Adicionar"}
              </button>
            </form>
          </div>
        )}

        {Number(q.discount_value) > 0 && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(239, 68, 68, 0.05)", borderRadius: 10, border: "1px dashed #ef444455" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444", fontWeight: 700 }}>🎟️ Cupom Promocional Aplicado</span>
              <span style={{ fontWeight: 800, color: "#ef4444" }}>- {fmt(Number(q.discount_value))}</span>
            </div>
          </div>
        )}

        {Number(q.credits_used) > 0 && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(99, 102, 241, 0.05)", borderRadius: 10, border: "1px dashed #6c63ff55" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent)", fontWeight: 700 }}>🎁 Cashback Utilizado</span>
              <span style={{ fontWeight: 800, color: "var(--accent)" }}>- {fmt(Number(q.credits_used))}</span>
            </div>
          </div>
        )}

        {Number(q.shipping_cost) > 0 && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--surface2)", borderRadius: 10, border: "1px dashed var(--muted)" }}>
            <CostRow icon="🚚" label={`Cálculo de Frete (${q.shipping_service || 'Entrega'})`} value={`+ ${fmt(Number(q.shipping_cost))}`} accent />
          </div>
        )}

        {Number(q.tax_amount) > 0 && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--surface2)", borderRadius: 10, border: "1px dashed var(--muted)" }}>
            <CostRow icon="🏛️" label={`Imposto Aplicado (${q.tax_pct_applied}%)`} value={`+ ${fmt(Number(q.tax_amount))}`} accent />
          </div>
        )}

        {/* Extras / Upsells */}
        {q.extras && q.extras !== "[]" && q.extras !== "null" && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
              ✨ Serviços de Pós-Processamento Adquiridos
            </div>
            {(() => {
              try {
                const parsed = JSON.parse(q.extras);
                if (!Array.isArray(parsed)) return null;
                return parsed.map((up: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999,
                        background: "#6c63ff22",
                        color: "var(--accent)",
                        border: "1px solid #6c63ff44",
                      }}>
                        {up.per_unit ? "Por Peça" : "Lote Fixo"}
                      </span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{up.name}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: "var(--text-color)" }}>+ {fmt(Number(up.price_applied))}</span>
                  </div>
                ));
              } catch (e) {
                return null;
              }
            })()}
          </div>
        )}

        <div style={{ marginTop: "1rem", padding: "1.25rem", background: "linear-gradient(135deg,#6c63ff22,#22c55e11)", borderRadius: 12, border: "1px solid var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Preço por Unidade (Base)</div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--green)" }}>{fmt(q.final_price_per_unit)}</div>
            </div>
            {Number(q.quantity) > 1 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Valor Total do Pedido ({q.quantity} peças)</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent)" }}>{fmt(Math.max(0, Number(q.final_price) + Number(q.tax_amount || 0) + Number(q.shipping_cost || 0) - Number(q.credits_used || 0)))}</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "0.5rem", textAlign: "center", fontWeight: 600 }}>
            * O Valor Total acima já inclui {q.tax_pct_applied}% de impostos e frete.
          </div>
        </div>
      </div>

      {/* ChatBox */}
      {q.config?.enable_chat && (
        <div style={{ marginBottom: "1.5rem" }}>
          <ChatBox quoteId={q.id} currentUserType="admin" />
        </div>
      )}

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <Link href="/cotacoes/nova"><button className="btn btn-primary">Nova Cotação</button></Link>
        <Link href="/cotacoes"><button className="btn btn-ghost">← Histórico</button></Link>
      </div>

      {deliveredModal && (
        <div className="modal-overlay" onClick={() => !uploading && setDeliveredModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>📦 Marcar como Entregue</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              Opcional: Envie uma foto da peça pronta para encantar o cliente no aviso do WhatsApp.
            </p>
            <form onSubmit={submitDelivered}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="label">📸 Foto do Resultado (Proof of Work)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                  className="input"
                  disabled={uploading}
                />
              </div>

              <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setShowInShowroom(!showInShowroom)}>
                <input
                  type="checkbox"
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  checked={showInShowroom}
                  onChange={() => { }}
                />
                <label style={{ fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", color: "var(--text)" }}>
                  🌟 Exibir na Vitrine Pública (Portfólio)
                </label>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? "Salvando..." : "Confirmar Entrega"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setDeliveredModal(false)} disabled={uploading}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
