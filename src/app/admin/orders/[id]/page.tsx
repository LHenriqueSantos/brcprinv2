"use client";

import { useEffect, useState, use } from "react";
import {
  ArrowLeft,
  Package,
  Truck,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Save,
  Loader2,
  ExternalLink,
  Printer,
  FileText,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [buyingLabel, setBuyingLabel] = useState(false);

  // Editable fields
  const [status, setStatus] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [notes, setNotes] = useState("");

  // Deep Edit Client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientDocument, setClientDocument] = useState("");

  // Deep Edit Shipping
  const [clientZipcode, setClientZipcode] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientNumber, setClientNumber] = useState("");
  const [clientComplement, setClientComplement] = useState("");

  useEffect(() => {
    fetchOrderDetail();
  }, []);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      setOrder(data);
      setStatus(data.status);
      setTrackingCode(data.shipping_tracking_code || "");
      setNotes(data.notes || "");

      // Load deep edit states
      setClientName(data.client_name || "");
      setClientEmail(data.client_email || "");
      setClientPhone(data.client_phone || "");
      setClientDocument(data.client_document || "");
      setClientZipcode(data.client_zipcode || "");
      setClientAddress(data.client_address || "");
      setClientNumber(data.client_number || "");
      setClientComplement(data.client_complement || "");
    } catch (e) {
      console.error("Failed to fetch order", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status, shipping_tracking_code: trackingCode, notes,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          client_document: clientDocument,
          client_zipcode: clientZipcode,
          client_address: clientAddress,
          client_number: clientNumber,
          client_complement: clientComplement
        })
      });
      if (res.ok) {
        alert("Pedido e dados de entrega/cliente atualizados com sucesso!");
        fetchOrderDetail();
      } else {
        throw new Error("Erro na API.");
      }
    } catch (e) {
      alert("Erro ao atualizar pedido.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("ATENÇÃO: Você está prestes a EXCLUIR PERMANENTEMENTE este pedido do sistema, bem como todos os itens vinculados a ele. Esta ação não pode ser desfeita. Tem certeza que deseja prosseguir?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Pedido excluído com sucesso.");
        router.push("/admin/orders");
      } else {
        throw new Error("Erro na deleção");
      }
    } catch (e) {
      alert("Erro ao excluir o pedido.");
      setDeleting(false);
    }
  };

  const handleBuyLabel = async () => {
    if (!confirm("Confirmar a compra da etiqueta no Melhor Envios? O endereço que estiver salvo na tela será utilizado.")) return;
    setBuyingLabel(true);
    try {
      const res = await fetch(`/api/shipping/melhorenvio/buy?orderId=${id}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Etiqueta comprada com sucesso!");
        fetchOrderDetail();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      alert("Erro ao comprar etiqueta: " + e.message);
    } finally {
      setBuyingLabel(false);
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Carregando pedido...</div>;
  if (!order) return <div style={{ padding: "4rem", textAlign: "center" }}>Pedido não encontrado.</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <Link href="/admin/orders" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontWeight: 600 }}>
          <ArrowLeft size={18} /> Voltar para Lista
        </Link>

        <button className="btn" style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", gap: "0.5rem" }} onClick={handleDelete} disabled={deleting}>
          {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
          Excluir Pedido Permanentemente
        </button>
      </header>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, margin: 0 }}>Pedido #{order.id}</h1>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.6rem", color: "var(--muted)", fontSize: "0.9rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Calendar size={16} /> {new Date(order.created_at).toLocaleString('pt-BR')}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><CreditCard size={16} /> {order.mp_payment_id ? `ID MP: ${order.mp_payment_id}` : 'Pagamento Pendente'}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn" style={{ background: "transparent", border: "1px solid var(--border)", gap: "0.5rem" }} onClick={() => window.print()}>
            <Printer size={18} /> Imprimir Pedido
          </button>
          <button className="btn btn-primary" style={{ gap: "0.5rem" }} onClick={handleUpdate} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Alterações
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2.5rem" }}>
        {/* Left Column: Items & Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Section: Status Manager */}
          <section style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div className="form-group">
                <label className="label" style={{ fontWeight: 800 }}>Status do Pedido</label>
                <select className="select" value={status} onChange={e => setStatus(e.target.value)} style={{ padding: "0.8rem", borderRadius: "10px", width: "100%", background: "var(--surface1)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  <option value="pending_payment">Pendente de Pagamento</option>
                  <option value="paid">Pago</option>
                  <option value="processing">Em Produção</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label" style={{ fontWeight: 800 }}>Código de Rastreamento</label>
                <input className="input" value={trackingCode} onChange={e => setTrackingCode(e.target.value)} placeholder="Ex: BR123456789BR" />
              </div>
            </div>
          </section>

          {/* Section: Items Table */}
          <section style={{ background: "var(--surface2)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "1.2rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <Package size={20} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Itens do Pedido ({order.items?.length})</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid var(--border)" }}>
                <tr>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>ITEM</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>TIPO</th>
                  <th style={{ textAlign: "center", padding: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>QTY</th>
                  <th style={{ textAlign: "right", padding: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1.2rem" }}>
                      <div style={{ fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{item.color ? `Cor: ${item.color}` : "N/A"}</div>
                      {item.stl_file_url && (
                        <a href={item.stl_file_url} target="_blank" style={{ fontSize: "0.75rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.4rem", textDecoration: "none" }}>
                          <ExternalLink size={12} /> Ver Arquivo 3D
                        </a>
                      )}
                    </td>
                    <td style={{ padding: "1.2rem" }}>
                      <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "var(--surface1)", borderRadius: "4px", textTransform: "uppercase", fontWeight: 600 }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: "1.2rem", textAlign: "center", fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ padding: "1.2rem", textAlign: "right", fontWeight: 800 }}>R$ {(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Section: Notes */}
          <section style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <label className="label" style={{ fontWeight: 800, marginBottom: "0.8rem" }}>Observações Internas (Não visível ao cliente)</label>
            <textarea className="input" style={{ minHeight: 120, paddingTop: "0.8rem", width: "100%" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Adicione notas sobre o pedido..." />
          </section>
        </div>

        {/* Right Column: Customer & Shipping */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Editable Customer Info */}
          <section style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.5rem", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <User size={20} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Dados do Cliente</h3>
              </div>
              {order.client_id && (
                <Link href={`/admin/clients/${order.client_id}`} style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700, textDecoration: "none", background: "rgba(108, 99, 255, 0.1)", padding: "0.3rem 0.6rem", borderRadius: "100px" }}>Conta Oficial Mapeada</Link>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="label" style={{ fontSize: "0.8rem" }}>Nome de Entrega/Faturamento</label>
                <input className="input" value={clientName} onChange={e => setClientName(e.target.value)} style={{ padding: "0.6rem", fontSize: "0.9rem" }} />
              </div>
              <div className="form-group">
                <label className="label" style={{ fontSize: "0.8rem" }}>E-mail</label>
                <input className="input" value={clientEmail} onChange={e => setClientEmail(e.target.value)} style={{ padding: "0.6rem", fontSize: "0.9rem" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label" style={{ fontSize: "0.8rem" }}>Telefone</label>
                  <input className="input" value={clientPhone} onChange={e => setClientPhone(e.target.value)} style={{ padding: "0.6rem", fontSize: "0.9rem" }} />
                </div>
                <div className="form-group">
                  <label className="label" style={{ fontSize: "0.8rem" }}>CPF / CNPJ</label>
                  <input className="input" value={clientDocument} onChange={e => setClientDocument(e.target.value)} style={{ padding: "0.6rem", fontSize: "0.9rem" }} />
                </div>
              </div>
            </div>
          </section>

          {/* Editable Shipping Info */}
          <section style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.5rem" }}>
              <Truck size={20} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Logística</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {order.delivery_method === 'pickup' ? (
                <div style={{ padding: "0.8rem", background: "rgba(108, 99, 255, 0.05)", borderRadius: "8px", border: "1px solid var(--accent)", color: "var(--accent)", fontWeight: 700, textAlign: "center" }}>
                  RETIRA NA LOJA
                </div>
              ) : (
                <>
                  <div style={{ padding: "1rem", background: "var(--surface1)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Serviço Contratado</div>
                    <div style={{ fontWeight: 700 }}>{order.shipping_service || "Não selecionado"}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent)", marginTop: "0.4rem" }}>R$ {Number(order.shipping_cost).toFixed(2)}</div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 700, textTransform: "uppercase" }}>Endereço de Destino (Editável)</div>

                    <div className="form-group">
                      <label className="label" style={{ fontSize: "0.8rem" }}>CEP</label>
                      <input className="input" value={clientZipcode} onChange={e => setClientZipcode(e.target.value)} style={{ padding: "0.6rem", fontSize: "0.9rem" }} />
                    </div>
                    <div className="form-group">
                      <label className="label" style={{ fontSize: "0.8rem" }}>Rua / Logradouro</label>
                      <input className="input" value={clientAddress} onChange={e => setClientAddress(e.target.value)} style={{ padding: "0.6rem", fontSize: "0.9rem" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="label" style={{ fontSize: "0.8rem" }}>Número</label>
                        <input className="input" value={clientNumber} onChange={e => setClientNumber(e.target.value)} style={{ padding: "0.6rem", fontSize: "0.9rem" }} />
                      </div>
                      <div className="form-group">
                        <label className="label" style={{ fontSize: "0.8rem" }}>Complemento</label>
                        <input className="input" value={clientComplement} onChange={e => setClientComplement(e.target.value)} style={{ padding: "0.6rem", fontSize: "0.9rem" }} />
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    disabled={buyingLabel || order.status === 'pending_payment'}
                    style={{ width: "100%", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}
                    onClick={handleBuyLabel}
                  >
                    {buyingLabel ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    Gerar Etiqueta (Melhor Envios)
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Financial Summary */}
          <section style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 1.2rem", fontSize: "1.1rem", fontWeight: 800 }}>Financeiro</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--muted)" }}>Subtotal</span>
                <span>R$ {Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--muted)" }}>Frete</span>
                <span>R$ {Number(order.shipping_cost).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#ef4444" }}>
                <span>Desconto {order.coupon_code && `(${order.coupon_code})`}</span>
                <span>- R$ {Number(order.discount_value).toFixed(2)}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)", margin: "0.5rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: "var(--accent)" }}>R$ {Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
