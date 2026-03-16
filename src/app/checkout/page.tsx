"use client";

import { useCart } from "@/store/cartStore";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Truck, Store, CreditCard, ChevronRight, Package, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Delivery, 2: Shipping, 3: Payment
  const [loading, setLoading] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Delivery & Address
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
  const [address, setAddress] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    zipcode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  });

  // Step 2: Shipping Options
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);

  // Totals
  const discountValue = 0; // Cupom logic could be added here
  const shippingCost = deliveryMethod === 'pickup' ? 0 : (selectedShipping?.price || 0);
  const total = subtotal + shippingCost - discountValue;

  useEffect(() => {
    if (items.length === 0 && step === 1) {
      // router.push("/carrinho"); // Uncomment later
    }
  }, [items, step, router]);

  const handleZipcodeBlur = async () => {
    const cep = address.zipcode.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (e) {
      console.error("CEP lookup failed", e);
    }
  };

  const calculateShippingRates = async () => {
    setCalculatingShipping(true);
    setError("");
    try {
      // We assume a standard volume for calculation based on the items
      // Weight can be summed up if items have weight_g
      const totalWeight = items.reduce((acc, item) => acc + (item.extras?.weight_g || 100) * item.quantity, 0);

      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromZip: "01001000", // Will fetch from DB config in production
          toZip: address.zipcode,
          weight_g: totalWeight,
          dimensions: { length: 20, width: 20, height: 20 },
          provider: 'melhorenvio'
        })
      });
      const options = await res.json();
      setShippingOptions(options);
      if (options.length > 0) {
        setSelectedShipping(options[0]);
      }
    } catch (e) {
      setError("Erro ao calcular frete. Tente novamente.");
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Create Order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          address,
          deliveryMethod,
          shippingService: selectedShipping,
          shippingCost,
          subtotal,
          total,
          discountValue,
          notes: ""
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Erro ao criar pedido");

      // 2. Create Payment Preference
      const payRes = await fetch(`/api/orders/${orderData.orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken: orderData.publicToken })
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "Erro ao gerar pagamento");

      // 3. Redirect to MercadoPago
      window.location.href = payData.init_point;

      // We don't clear cart here yet, we do it in success page
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "2rem" }}>Finalizar Compra</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2.5rem" }}>
        {/* Main Flow */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* STEP 1: DELIVERY */}
          <section style={{ background: "var(--surface2)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: step >= 1 ? "var(--accent)" : "var(--border)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>1</div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Dados de Entrega</h2>
            </div>

            {step === 1 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div
                    onClick={() => setDeliveryMethod('shipping')}
                    style={{ padding: "1.5rem", borderRadius: "12px", border: `2px solid ${deliveryMethod === 'shipping' ? 'var(--accent)' : 'var(--border)'}`, background: deliveryMethod === 'shipping' ? 'rgba(108, 99, 255, 0.05)' : 'transparent', cursor: "pointer", transition: "all 0.2s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
                      <Truck size={20} color={deliveryMethod === 'shipping' ? 'var(--accent)' : 'var(--text)'} />
                      <span style={{ fontWeight: 700 }}>Enviar p/ Endereço</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>Receba em casa via Correios ou Transportadora.</p>
                  </div>
                  <div
                    onClick={() => setDeliveryMethod('pickup')}
                    style={{ padding: "1.5rem", borderRadius: "12px", border: `2px solid ${deliveryMethod === 'pickup' ? 'var(--accent)' : 'var(--border)'}`, background: deliveryMethod === 'pickup' ? 'rgba(108, 99, 255, 0.05)' : 'transparent', cursor: "pointer", transition: "all 0.2s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
                      <Store size={20} color={deliveryMethod === 'pickup' ? 'var(--accent)' : 'var(--text)'} />
                      <span style={{ fontWeight: 700 }}>Retirar na Loja</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>Retire sem custo em nossa unidade física.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="label">Nome Completo</label>
                      <input className="input" value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} placeholder="Ex: João Silva" />
                    </div>
                    <div className="form-group">
                      <label className="label">E-mail</label>
                      <input className="input" value={address.email} onChange={e => setAddress({ ...address, email: e.target.value })} placeholder="joao@email.com" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="label">CPF ou CNPJ</label>
                      <input className="input" value={address.document} onChange={e => setAddress({ ...address, document: e.target.value })} placeholder="000.000.000-00" />
                    </div>
                    <div className="form-group">
                      <label className="label">Telefone / WhatsApp</label>
                      <input className="input" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} placeholder="(11) 99999-9999" />
                    </div>
                  </div>

                  {deliveryMethod === 'shipping' && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                        <div className="form-group">
                          <label className="label">CEP</label>
                          <input className="input" value={address.zipcode} onBlur={handleZipcodeBlur} onChange={e => setAddress({ ...address, zipcode: e.target.value })} placeholder="00000-000" />
                        </div>
                        <div className="form-group">
                          <label className="label">Rua / Logradouro</label>
                          <input className="input" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                          <label className="label">Número</label>
                          <input className="input" value={address.number} onChange={e => setAddress({ ...address, number: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="label">Complemento</label>
                          <input className="input" value={address.complement} onChange={e => setAddress({ ...address, complement: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="label">Bairro</label>
                          <input className="input" value={address.neighborhood} onChange={e => setAddress({ ...address, neighborhood: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                          <label className="label">Cidade</label>
                          <input className="input" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="label">UF</label>
                          <input className="input" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} maxLength={2} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-end", padding: "0.8rem 2.5rem" }}
                  onClick={() => {
                    if (deliveryMethod === 'shipping') {
                      setStep(2);
                      calculateShippingRates();
                    } else {
                      setStep(3);
                    }
                  }}
                >
                  Continuar <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "0.95rem" }}>
                  {deliveryMethod === 'pickup' ? "Retirada na Loja" : `Enviar para ${address.zipcode}, ${address.number}`}
                </p>
                <button onClick={() => setStep(1)} style={{ background: "transparent", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>Editar</button>
              </div>
            )}
          </section>

          {/* STEP 2: SHIPPING */}
          <section style={{ background: "var(--surface2)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)", opacity: step < 2 && deliveryMethod === 'shipping' ? 0.6 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: step >= 2 ? "var(--accent)" : "var(--border)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>2</div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Opções de Envio</h2>
            </div>

            {step === 2 && deliveryMethod === 'shipping' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {calculatingShipping ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "var(--muted)", padding: "2rem", justifyContent: "center" }}>
                    <Loader2 size={32} className="animate-spin" /> Calculando frete...
                  </div>
                ) : (
                  <>
                    {shippingOptions.map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedShipping(opt)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", borderRadius: "12px", border: `2px solid ${selectedShipping?.id === opt.id ? 'var(--accent)' : 'var(--border)'}`, background: selectedShipping?.id === opt.id ? 'rgba(108, 99, 255, 0.05)' : 'transparent', cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--accent)", background: selectedShipping?.id === opt.id ? 'var(--accent)' : 'transparent', display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {selectedShipping?.id === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{opt.name} ({opt.company})</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Previsão de {opt.delivery_range}</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: "var(--accent)" }}>R$ {opt.price.toFixed(2)}</div>
                      </div>
                    ))}
                    <button
                      className="btn btn-primary"
                      style={{ alignSelf: "flex-end", marginTop: "1rem", padding: "0.8rem 2.5rem" }}
                      onClick={() => setStep(3)}
                    >
                      Continuar <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            )}
            {step > 2 && deliveryMethod === 'shipping' && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "0.95rem" }}>{selectedShipping?.name} - R$ {selectedShipping?.price.toFixed(2)}</p>
                <button onClick={() => setStep(2)} style={{ background: "transparent", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>Alterar</button>
              </div>
            )}
          </section>

          {/* STEP 3: PAYMENT */}
          <section style={{ background: "var(--surface2)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)", opacity: step < 3 ? 0.6 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: step >= 3 ? "var(--accent)" : "var(--border)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>3</div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Pagamento</h2>
            </div>

            {step === 3 && (
              <div style={{ padding: "0 0 0 3.2rem" }}>
                <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
                  Ao clicar em concluir, você será redirecionado para o ambiente seguro do <strong>Mercado Pago</strong> para realizar o pagamento (Cartão, PIX ou Boleto).
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ padding: "1.5rem", borderRadius: "12px", border: "2px solid var(--accent)", background: "rgba(108, 99, 255, 0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <CreditCard size={24} color="var(--accent)" />
                    <div>
                      <div style={{ fontWeight: 800 }}>Mercado Pago</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Cartão, PIX, Mercado Crédito</div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: "100%", marginTop: "2rem", padding: "1.2rem", fontSize: "1.1rem", justifyContent: "center" }}
                  onClick={handleCreateOrder}
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" /> Processando...</>
                  ) : "Confirmar e Ir para Pagamento"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Summary */}
        <div>
          <div style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)", position: "sticky", top: "2rem" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", fontWeight: 800 }}>Resumo do Pedido</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {items.map(item => (
                <div key={item.id} style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, background: "rgba(108, 99, 255, 0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                    <Package size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.2 }}>{item.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.quantity}x {item.color}</div>
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>R$ {(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: "var(--border)", margin: "1.5rem 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--muted)" }}>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--muted)" }}>Frete</span>
                <span style={{ color: shippingCost === 0 ? "var(--green)" : "var(--text)" }}>{shippingCost === 0 ? "Grátis" : `R$ ${shippingCost.toFixed(2)}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, marginTop: "0.5rem" }}>
                <span>Total</span>
                <span style={{ color: "var(--accent)" }}>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
