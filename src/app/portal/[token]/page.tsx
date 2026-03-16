"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getStatusInfo } from "@/lib/status";
import ModelViewer from "@/components/ModelViewer";
import OrderTimeline from "@/components/OrderTimeline";
import ChatBox from "@/components/ChatBox";
import AnimatedDownloadButton from "@/components/AnimatedDownloadButton";
import AiChatWidget from "@/components/AiChatWidget";
import PortalLoginGate from "@/components/PortalLoginGate";

export default function PortalPage() {
  const { data: session, status: authStatus } = useSession();
  const { token } = useParams<{ token: string }>();

  const [q, setQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [showQuantityMod, setShowQuantityMod] = useState(false);
  const [newQty, setNewQty] = useState(1);
  const [counterPrice, setCounterPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // Address Collection for new customers
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComp, setAddressComp] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Coupon handling
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // True once the client has authenticated via PortalLoginGate
  const [portalAuthOk, setPortalAuthOk] = useState(false);

  const handleZipcodeBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setStateCode(data.uf || "");
      }
    } catch (e) { console.error("ViaCEP Err:", e) }
  };

  // i18n
  const [lang, setLang] = useState<string>("pt");
  const [dictionary, setDictionary] = useState<any>(null);

  // PIX Integration State
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);

  useEffect(() => {
    // Find quote by public_token via a dedicated API
    fetch(`/api/portal/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else {
          setQ(data);
          // Set default language from config
          // Set default language from config
          if (data.config?.language_default) setLang(data.config.language_default);

          // Auto-select existing shipping if any (handle 0 cost for 'carrier_pending')
          if (data.shipping_service) {
            setSelectedShipping({ name: data.shipping_service, price: Number(data.shipping_cost || 0) });
          }

          // Pre-fill identification form with existing data if available
          setZipcode(data.client_zipcode || "");
          setAddress(data.client_address || "");
          setAddressNumber(data.client_address_number || "");
          setAddressComp(data.client_address_comp || "");
          setNeighborhood(data.client_neighborhood || "");
          setCity(data.client_city || "");
          setStateCode(data.client_state || "");
          setDocumentNumber(data.client_document || "");
          setClientName(data.client_name || "");
          setClientEmail(data.client_email || "");
          setClientPhone(data.client_phone || "");

          // Force identification form if no client is linked yet
          if (!data.client_id || !data.client_name) {
            setShowAddressModal(true);
          }
        }
        setLoading(false);
      })
      .catch(() => { setError("Erro ao carregar cotação"); setLoading(false); });
  }, [token]);

  // SSO Bypass: If user is already logged in with the same email as the quote client, auto-auth
  useEffect(() => {
    if (session?.user?.email && q?.client_email && session.user.email === q.client_email) {
      setPortalAuthOk(true);
    }
  }, [session, q?.client_email]);

  // Load dictionary when language changes
  useEffect(() => {
    import(`../../../locales/${lang}.json`).then(m => setDictionary(m.default)).catch(console.error);
  }, [lang]);

  // Polling for PIX Payment Success
  useEffect(() => {
    if (!q || q.status !== 'approved' || !pixData) return;

    const interval = setInterval(() => {
      fetch(`/api/portal/${token}`)
        .then(r => r.json())
        .then(data => {
          if (!data.error && data.status === 'in_production') {
            // Payment confirmed via webhook!
            setQ({ ...q, status: 'in_production' });
            setPixData(null); // Hide PIX screen
            alert("Pagamento PIX confirmado com sucesso! Entrando em produção.");
          }
        })
        .catch(console.error);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [q, token, pixData]);

  // Auto-poll status for production tracking (every 15s while in approved/awaiting_payment/in_production)
  useEffect(() => {
    if (!q || !['approved', 'awaiting_payment', 'in_production'].includes(q.status)) return;
    const interval = setInterval(() => {
      fetch(`/api/portal/${token}`)
        .then(r => r.json())
        .then(data => {
          if (!data.error && data.status !== q.status) {
            setQ((prev: any) => ({ ...prev, status: data.status, result_photo_url: data.result_photo_url || prev.result_photo_url }));
          }
        })
        .catch(console.error);
    }, 15000);
    return () => clearInterval(interval);
  }, [q?.status, token]);



  // Translation helper
  const t = (key: string, vars: any = {}) => {
    if (!dictionary) return key;
    const parts = key.split('.');
    let val = dictionary;
    for (const p of parts) {
      val = val?.[p];
    }
    if (typeof val !== 'string') return key;
    let result = val;
    Object.keys(vars).forEach(k => {
      result = result.replace(`{{${k}}}`, vars[k]);
    });
    return result;
  };

  // Effect to calculate other shipping options if CEP is available
  useEffect(() => {
    if (q && q.client_zipcode && q.config?.company_zipcode && q.config?.shipping_api_provider !== 'none') {
      const weightGrams = Number(q.filament_used_g || 0);

      fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromZip: q.config.company_zipcode,
          toZip: q.client_zipcode,
          weight_g: weightGrams,
          dimensions: {
            length: q.config.packaging_length,
            width: q.config.packaging_width,
            height: q.config.packaging_height
          },
          provider: q.config.shipping_api_provider,
          token: q.config.shipping_api_token
        })
      })
        .then(r => r.json())
        .then(opts => {
          if (Array.isArray(opts)) {
            setShippingOptions(opts);
            if (opts.length > 0 && selectedShipping?.name === 'carrier_pending') {
              setSelectedShipping(opts[0]);
            }
          }
        });
    }
  }, [q]);

  const handlePayWithHours = async () => {
    if (!confirm(`Deseja usar ${q.print_time_hours} horas e ${q.filament_used_g}g do seu saldo para quitar este pedido?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/portal/${token}/pay-with-hours`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        alert("Pagamento concluído com sucesso via Banco de Horas!");
        setQ({ ...q, status: 'in_production' });
      }
    } catch (e) { console.error(e); alert("Erro ao processar"); }
    setActionLoading(false);
  };

  const handleApplyCoupon = async () => {
    if (!q || !couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch(`/api/quotes/${q.id}/apply-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: couponCode }),
      });
      const data = await res.json();
      if (data.success) {
        setQ((prev: any) => ({
          ...prev,
          coupon_id: data.coupon_id,
          discount_value: data.discount_amount,
          final_price: data.new_final_price
        }));
        setCouponCode("");
      } else {
        setCouponError(data.error || "Cupom inválido.");
      }
    } catch {
      setCouponError("Erro de conexão.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleStatusUpdate = async (action: string) => {
    if (!q) return;
    setActionLoading(true);

    const payload: any = { action, token };
    if (action === 'counter_offer') {
      payload.counter_offer_price = counterPrice;
      payload.counter_offer_notes = notes;
    }
    if (['approved', 'identify'].includes(action) && selectedShipping) {
      payload.shipping_service = selectedShipping.name;
      payload.shipping_cost = selectedShipping.price;
    }
    if (action === 'approved') {
      payload.credits_used = appliedCashback;
    }
    if (['approved', 'identify'].includes(action) && documentNumber && clientName) {
      // Validate password confirmation before submitting
      if (password && password !== confirmPassword) {
        setPasswordError("As senhas não coincidem.");
        setActionLoading(false);
        return;
      }
      setPasswordError("");
      payload.address_data = {
        client_zipcode: zipcode,
        client_address: address,
        client_address_number: addressNumber,
        client_address_comp: addressComp,
        client_neighborhood: neighborhood,
        client_city: city,
        client_state: stateCode,
        client_document: documentNumber,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        password: password || undefined
      };
    }

    try {
      const res = await fetch(`/api/quotes/${q.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'identify') {
          if (data.account_created) {
            // Account was created — user is now authenticated for this session
            setPortalAuthOk(true);
          }
          // Reload all data to reflect shipping in total
          fetch(`/api/portal/${token}`)
            .then(r => r.json())
            .then(updated => {
              setQ(updated);
              setShowAddressModal(false);
            });
          return;
        }

        setQ((prev: any) => ({
          ...prev,
          status: action,
          ...(payload.address_data ? payload.address_data : {})
        }));
        if (action === 'counter_offer') setShowCounter(false);
        if (action === 'approved') setShowAddressModal(false);
      } else {
        alert(data.error || "Erro ao atualizar status.");
      }
    } catch (e) {
      alert("Erro de comunicação com o servidor.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIdentify = () => handleStatusUpdate('identify');

  const handleQuantityRequest = async () => {
    if (!q) return;
    if (newQty === q.quantity) { setShowQuantityMod(false); return; }
    setActionLoading(true);

    try {
      const res = await fetch(`/api/quotes/${q.id}/update-quantity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, quantity: newQty }),
      });
      const data = await res.json();
      if (data.success) {
        setQ((prev: any) => ({
          ...prev,
          quantity: data.quantity,
          final_price: data.final_price,
          final_price_per_unit: data.final_price_per_unit,
        }));
        setShowQuantityMod(false);
      } else {
        alert(data.error || "Erro ao atualizar quantidade.");
      }
    } catch (e) {
      alert("Erro de comunicação com o servidor.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!q) return;
    window.open(`/api/quotes/${q.id}/pdf?token=${token}`, "_blank");
  };

  const fmt = (v: number) => {
    const symbol = q?.config?.currency_symbol || "R$";
    const code = q?.config?.currency_code || "BRL";
    try {
      return Number(v).toLocaleString(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency: code
      });
    } catch {
      return `${symbol} ${Number(v).toFixed(2)}`;
    }
  };

  const handleGeneratePix = async () => {
    if (!q) return;
    setPixLoading(true);
    try {
      const res = await fetch(`/api/quotes/${q.id}/pay-pix`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPixData(data);
      } else {
        alert(data.error || "Erro ao gerar PIX");
      }
    } catch (e) {
      alert("Erro de comunicação com o servidor.");
    } finally {
      setPixLoading(false);
    }
  };

  const [cardLoading, setCardLoading] = useState(false);
  const handlePayWithCard = async () => {
    if (!q) return;
    setCardLoading(true);
    try {
      const res = await fetch(`/api/quotes/${q.id}/pay-card`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(data.error || "Erro ao iniciar pagamento com cartão");
      }
    } catch (e) {
      alert("Erro de comunicação com o servidor.");
    } finally {
      setCardLoading(false);
    }
  };

  if (loading || authStatus === 'loading') return (
    <div style={{ color: "var(--muted)", textAlign: "center", paddingTop: "4rem" }}>Carregando cotação…</div>
  );

  if (error || !q) return (
    <div style={{ maxWidth: 500, width: "100%", textAlign: "center", paddingTop: "4rem", margin: "0 auto" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
      <h2 style={{ margin: 0, color: "var(--text)" }}>{t('error_not_found')}</h2>
      <p style={{ color: "var(--muted)" }}>{t('error_not_found_msg')}</p>
    </div>
  );

  // Show login gate if the linked client has a password and the user is not yet authenticated
  // and we don't have a matching session (SSO)
  const isSsoAuthenticated = (
    // Check by email (case insensitive)
    (session?.user?.email && q?.client_email && session.user.email.toLowerCase() === q.client_email.toLowerCase()) ||
    // OR check by ID (stringified to handle type mismatch)
    (q?.client_id && (session?.user as any)?.id && String((session?.user as any).id) === String(q.client_id))
  );

  if (q.client_id && q.client_has_password && !portalAuthOk && !isSsoAuthenticated) {
    return (
      <PortalLoginGate
        token={token}
        quoteId={q.id}
        clientEmail={q.client_email || ""}
        onAuthenticated={() => setPortalAuthOk(true)}
      />
    );
  }

  // Robust price calculations to avoid NaN and string concatenation
  const currentShippingCost = Number(q.shipping_cost || 0);
  const basePriceWithoutCurrentShipping = Number(q.final_price || 0) - currentShippingCost;

  const selectedShippingPrice = selectedShipping ? Number(selectedShipping.price || 0) : 0;

  // Parts + Extras (No shipping)
  const subtotalParts = basePriceWithoutCurrentShipping;

  // Active shipping for current display
  const displayShippingPrice = selectedShipping ? selectedShippingPrice : currentShippingCost;

  const subtotalWithShipping = subtotalParts + displayShippingPrice;
  const taxPct = Number(q.config?.default_tax_pct || 0);
  const taxAmount = (subtotalWithShipping * taxPct) / 100;

  const totalWithTax = subtotalWithShipping + taxAmount;
  let appliedCashback = 0;

  const creditBalance = Number(q.credit_balance || 0);
  const creditsUsed = Number(q.credits_used || 0);

  if (q.config?.enable_cashback && creditBalance > 0 && !['approved', 'in_production', 'delivered', 'awaiting_payment'].includes(q.status)) {
    appliedCashback = Math.min(creditBalance, totalWithTax);
    if (totalWithTax - appliedCashback <= 0) {
      appliedCashback = Math.max(0, totalWithTax - 1);
    }
  }

  // If quote already paid or approved, we must respect q.credits_used from DB
  if (creditsUsed > 0) {
    appliedCashback = creditsUsed;
  }

  const finalPayable = Math.max(0, totalWithTax - appliedCashback);
  const unitPriceWithTax = finalPayable / (Number(q.quantity) || 1);

  return (
    <div className="portal-container" style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto", minHeight: "100vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/brcprint.svg" alt="brcprint" style={{ height: "42px", width: "auto" }} />
          <div>
            <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: "4px 0 0", opacity: 0.8 }}>{t('footer.tagline')}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>

          {/* Client navigation — shown when a client account is linked */}
          {q.client_id && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <a
                href="/cliente"
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 0.9rem", borderRadius: "8px",
                  fontSize: "0.8rem", fontWeight: 600,
                  background: "var(--surface2)", color: "var(--text)",
                  border: "1px solid var(--border)", textDecoration: "none",
                  transition: "all 0.2s"
                }}
              >
                📦 Meus Pedidos
              </a>
              <a
                href="/cliente/perfil"
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 0.9rem", borderRadius: "8px",
                  fontSize: "0.8rem", fontWeight: 600,
                  background: "var(--accent)", color: "white",
                  border: "none", textDecoration: "none",
                  transition: "all 0.2s"
                }}
              >
                👤 Minha Conta
              </a>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", background: "var(--surface)", padding: "0.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            {["pt", "en", "es"].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  background: lang === l ? "var(--accent)" : "transparent",
                  color: lang === l ? "white" : "var(--muted)",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2.5rem" }}>
        {/* Left: Details */}
        <section>
          {q.result_photo_url && (
            <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem", border: "2px solid #10b981", background: "#f0fdf4" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#065f46", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span>🎉</span> Peça Finalizada (Proof of Work)
              </h3>
              <div style={{ borderRadius: 8, overflow: "hidden" }}>
                <img src={q.result_photo_url} alt="Proof of Work" style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            </div>
          )}

          {/* Enhanced 3D Viewer - Top Position */}
          {q.config?.enable_3d_viewer && (q.file_url || q.file_urls) && (
            <div className="card" style={{ padding: "0", marginBottom: "2rem", overflow: "hidden", border: "2px solid var(--border)" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>🧊 {t('viewer_title')}</h3>
                {(q.file_urls ? (typeof q.file_urls === 'string' ? JSON.parse(q.file_urls) : q.file_urls) : [q.file_url]).length > 1 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700 }}>
                    {selectedFileIndex + 1} / {(q.file_urls ? (typeof q.file_urls === 'string' ? JSON.parse(q.file_urls) : q.file_urls) : [q.file_url]).length} {t('actions.files')}
                  </div>
                )}
              </div>

              <div style={{ height: 500, position: "relative", background: "var(--surface)" }}>
                <ModelViewer
                  url={(q.file_urls ? (typeof q.file_urls === 'string' ? JSON.parse(q.file_urls) : q.file_urls) : [q.file_url])[selectedFileIndex]}
                  color="#3c5077"
                  materialType={q.filament_type}
                />
              </div>

              {/* File Selector & Download Section */}
              <div style={{ padding: "1rem", background: "var(--surface2)", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {(q.file_urls ? (typeof q.file_urls === 'string' ? JSON.parse(q.file_urls) : q.file_urls) : [q.file_url]).map((url: string, idx: number) => {
                    const fileName = url.split('/').pop()?.split('-').slice(1).join('-') || url.split('/').pop();
                    const isSelected = selectedFileIndex === idx;
                    return (
                      <div key={idx} style={{
                        flex: 1,
                        minWidth: "200px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        background: isSelected ? "var(--surface)" : "rgba(0,0,0,0.05)",
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
                            fontSize: "0.85rem",
                            fontWeight: isSelected ? 700 : 400,
                            color: isSelected ? "var(--accent)" : "var(--text)"
                          }}
                          title={fileName}
                        >
                          {isSelected ? "👁️ " : "📄 "}{fileName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {q.config?.enable_timeline && (
            <div style={{ marginBottom: "2rem" }}>
              <OrderTimeline status={q.status || "pending"} />
            </div>
          )}


          {q.reference_images && (
            <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem" }}>🖼️ Imagens de Referência</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
                {(typeof q.reference_images === 'string' ? JSON.parse(q.reference_images) : q.reference_images).map((imgUrl: string, idx: number) => (
                  <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", aspectRatio: "1/1" }}>
                    <img src={imgUrl} alt="Referência" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"} />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: "2rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>
                  {t('quote.status_label')}
                </div>
                <h2 style={{ fontSize: "2rem", fontWeight: 900, margin: 0 }}>{q.title || t('quote.untitled')}</h2>
                <p style={{ color: "var(--muted)", marginTop: "0.25rem" }}>{t('quote.id_label')}: #{q.id}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "50px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  backgroundColor: q.status === 'approved' ? "#22c55e22" : q.status === 'rejected' ? "#ef444422" : "#3b82f622",
                  color: q.status === 'approved' ? "#22c55e" : q.status === 'rejected' ? "#ef4444" : "#3b82f6",
                  display: "inline-block",
                  textTransform: "uppercase"
                }}>
                  {t(`status.${q.status}`)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                  {t('quote.valid_until')}: {new Date(q.valid_until).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US')}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
              <div style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                    {q.items ? '🧩 Peças da Montagem' : t('quote.print_params')}
                  </h3>
                  {q.items && (typeof q.items === 'string' ? JSON.parse(q.items) : q.items).length > 1 && (
                    <span style={{
                      fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "4px",
                      background: "var(--accent)", color: "white", fontWeight: 700, textTransform: "uppercase"
                    }}>
                      ⚡ Otimizado (Nesting)
                    </span>
                  )}
                </div>

                {q.items ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", textAlign: "left", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          <th style={{ padding: "0.5rem 0", color: "var(--muted)" }}>Peça</th>
                          <th style={{ padding: "0.5rem 0", color: "var(--muted)" }}>Material</th>
                          <th style={{ padding: "0.5rem 0", color: "var(--muted)" }}>Qtd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(typeof q.items === 'string' ? JSON.parse(q.items) : q.items).map((item: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "0.75rem 0", fontWeight: 700 }}>{item.name}</td>
                            <td style={{ padding: "0.75rem 0" }}>{item.material} {item.color}</td>
                            <td style={{ padding: "0.75rem 0" }}>{item.quantity}un</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--muted)", textAlign: "right" }}>
                      Tempo Total Est.: {q.print_time_hours}h | Peso Total: {q.filament_used_g}g
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.9rem" }}>{t('quote.printer')}</span>
                      <span style={{ fontWeight: 700 }}>{q.printer_name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.9rem" }}>{t('quote.filament')}</span>
                      <span style={{ fontWeight: 700 }}>{q.filament_name} ({q.filament_type}) - {q.filament_color || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.9rem" }}>{t('quote.weight')}</span>
                      <span style={{ fontWeight: 700 }}>{q.filament_used_g}g</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.9rem" }}>{t('quote.print_time')}</span>
                      <span style={{ fontWeight: 700 }}>{q.print_time_hours}h</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem" }}>{t('quote.composition')}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.9rem" }}>{t('quote.labor')}</span>
                    <span style={{ fontWeight: 700 }}>{fmt(q.cost_labor)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.9rem" }}>{t('quote.material')}</span>
                    <span style={{ fontWeight: 700 }}>{fmt(q.cost_filament)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.9rem" }}>{t('quote.energy')}</span>
                    <span style={{ fontWeight: 700 }}>{fmt(q.cost_energy)}</span>
                  </div>
                </div>
              </div>
            </div>

            {['quoted', 'approved', 'awaiting_payment'].includes(q.status) && !q.is_paid && (
              <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem" }}>🚚 {t('quote.shipping_options')}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>

                  <label style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", background: selectedShipping?.name === 'Retirada' ? "var(--surface)" : "transparent" }}>
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping?.name === 'Retirada em Mãos'}
                      onChange={() => setSelectedShipping({ name: 'Retirada em Mãos', price: 0 })}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>Retirada em Mãos</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Retirar grátis na loja.</div>
                    </div>
                    <div style={{ fontWeight: 800 }}>Grátis</div>
                  </label>

                  {shippingOptions.map((opt, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", background: selectedShipping?.id === opt.id ? "var(--surface)" : "transparent" }}>
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping?.id === opt.id}
                        onChange={() => setSelectedShipping(opt)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{opt.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{opt.delivery_range}</div>
                      </div>
                      <div style={{ fontWeight: 800 }}>{fmt(opt.price)}</div>
                    </label>
                  ))}

                  {(!q.client_zipcode || shippingOptions.length === 0) && q.config?.shipping_api_provider !== 'none' && (
                    <button onClick={() => setShowAddressModal(true)} type="button" style={{ marginTop: "0.5rem", width: "100%", padding: "0.75rem", border: "1px dashed var(--accent)", background: "transparent", color: "var(--text)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                      📍 Calcular Envio para seu CEP
                    </button>
                  )}
                </div>
              </div>
            )}

            {q.extras && q.extras.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem" }}>{t('quote.extras_label')}</h3>
                {JSON.parse(q.extras).map((ex: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.95rem" }}>{ex.name} <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>x{ex.quantity}</span></span>
                    <span style={{ fontWeight: 700 }}>{fmt(Number(ex.price_applied || ex.price) * Number(ex.quantity))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Cashback Earning Banner ── */}
          {q.config?.enable_cashback && Number(q.config?.cashback_pct || 0) > 0 && q.status === 'quoted' && (() => {
            const cashbackEarned = (Number(q.final_price || 0) * Number(q.config.cashback_pct || 0)) / 100;
            return cashbackEarned > 0 ? (
              <div style={{
                margin: "1rem 0",
                padding: "1rem 1.25rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #22c55e11, #16a34a22)",
                border: "1px solid #22c55e55",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}>
                <div style={{ fontSize: "1.5rem" }}>🪙</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#22c55e" }}>
                    Você vai ganhar {fmt(cashbackEarned)} de cashback!
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                    {Number(q.config?.cashback_pct || 0)}% do valor será creditado após a entrega
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* ── Action Buttons (visible only while awaiting client response or requiring shipping confirm) ── */}
          {(() => {
            const needsAddressData = !q.client_name || !q.client_document;
            const needsShippingSave = !q.shipping_service || (selectedShipping && q.shipping_service !== selectedShipping.name);
            const showGreenButton = needsAddressData || needsShippingSave || q.status === 'quoted';

            return showGreenButton && !q.is_paid && ['quoted', 'counter_offer', 'approved'].includes(q.status) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(q.status === 'quoted' || q.status === 'approved') && (
                  <button
                    onClick={() => {
                      if (needsAddressData) {
                        setShowAddressModal(true);
                      } else if (q.status === 'quoted') {
                        handleStatusUpdate('approved');
                      } else {
                        handleStatusUpdate('identify');
                      }
                    }}
                    disabled={actionLoading || (!needsAddressData && (!selectedShipping || selectedShipping.name === 'carrier_pending'))}
                    className="btn"
                    style={{
                      width: "100%", padding: "1.25rem", borderRadius: "12px",
                      fontSize: "1.15rem", fontWeight: 800, border: "none",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      color: "white", cursor: "pointer",
                      display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center",
                      boxShadow: "0 8px 16px rgba(34, 197, 94, 0.25)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      opacity: actionLoading ? 0.6 : 1
                    }}
                    onMouseOver={(e) => { if (!actionLoading) e.currentTarget.style.transform = "translateY(-2px)" }}
                    onMouseOut={(e) => { if (!actionLoading) e.currentTarget.style.transform = "translateY(0)" }}
                  >
                    {actionLoading ? t('actions.processing') :
                      needsAddressData ? "Avançar para Pagamento" :
                        q.status === 'approved' ? "Confirmar e Ir Para PIX" : t('actions.approve')}
                  </button>
                )}

                {q.subscription_status === 'active' && q.available_hours_balance >= Number(q.print_time_hours) && q.available_grams_balance >= Number(q.filament_used_g) && q.status === 'quoted' && (
                  <button
                    onClick={handlePayWithHours}
                    disabled={actionLoading}
                    className="btn"
                    style={{
                      width: "100%", padding: "1.25rem", borderRadius: "12px",
                      fontSize: "1.1rem", fontWeight: 800, border: "2px solid #6366f1",
                      background: "#e0e7ff", color: "#4f46e5", cursor: "pointer",
                      display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                  >
                    💳 Pagar com Banco VIP ({q.print_time_hours}h | {q.filament_used_g}g)
                  </button>
                )}

                {q.status === 'quoted' && (
                  <button
                    onClick={() => setShowCounter(true)}
                    disabled={actionLoading}
                    className="btn"
                    style={{
                      width: "100%", padding: "1.25rem", borderRadius: "12px",
                      fontSize: "1.1rem", fontWeight: 700, border: "2px solid var(--border)",
                      background: "transparent", color: "var(--text)", cursor: "pointer",
                      display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center",
                      transition: "all 0.2s",
                      opacity: actionLoading ? 0.6 : 1
                    }}
                    onMouseOver={(e) => { if (!actionLoading) e.currentTarget.style.borderColor = "var(--accent)" }}
                    onMouseOut={(e) => { if (!actionLoading) e.currentTarget.style.borderColor = "var(--border)" }}
                  >
                    {t('actions.counter_offer')}
                  </button>
                )}

                <button
                  onClick={() => {
                    if (!confirm("Tem certeza que deseja recusar esta cotação?")) return;
                    handleStatusUpdate('rejected');
                  }}
                  disabled={actionLoading || q.status !== 'quoted'}
                  className="btn"
                  style={{
                    width: "100%", padding: "1rem", borderRadius: "12px",
                    fontSize: "0.95rem", fontWeight: 600, border: "1px solid #ef444455",
                    background: "transparent", color: "#ef4444", cursor: "pointer",
                    display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center",
                    transition: "all 0.2s",
                    opacity: (actionLoading || q.status !== 'quoted') ? 0.5 : 1
                  }}
                >
                  ✕ {t('status.rejected') || 'Recusar Cotação'}
                </button>
              </div>
            ) : null;
          })()}

          {/* ── Post-approval status tracker ── */}
          {!['quoted', 'counter_offer', 'pending'].includes(q.status) && (
            <div style={{ borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Acompanhamento do Pedido</div>
              </div>
              {[
                { status: 'approved', icon: '✅', label: 'Cotação Aprovada', desc: 'Sua aprovação foi registrada' },
                {
                  status: 'awaiting_payment',
                  icon: q.is_paid ? '�' : '�💳',
                  label: q.is_paid ? 'Pagamento Recebido' : 'Aguardando Pagamento',
                  desc: q.is_paid ? 'Seu pagamento foi confirmado' : 'Realize o pagamento para liberar a produção'
                },
                { status: 'in_production', icon: '⚙️', label: 'Em Produção', desc: 'Sua peça está sendo impressa' },
                { status: 'delivered', icon: '📦', label: 'Entregue', desc: 'Pedido concluído!' },
              ].map((step, i) => {
                const statuses = ['approved', 'awaiting_payment', 'in_production', 'delivered'];
                const currentIdx = statuses.indexOf(q.status);
                const stepIdx = statuses.indexOf(step.status);
                let isDone = stepIdx <= currentIdx;
                if (step.status === 'awaiting_payment' && q.is_paid) isDone = true;
                if (step.status === 'approved' && q.is_paid) isDone = true; // Payment also implies approval
                const isCurrent = step.status === q.status;
                return (
                  <div key={step.status} style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem 1.25rem",
                    background: isCurrent ? "var(--accent)11" : "transparent",
                    borderLeft: isCurrent ? "3px solid var(--accent)" : "3px solid transparent",
                    borderBottom: i < 3 ? "1px solid var(--border)" : "none"
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.1rem",
                      background: isDone ? "var(--accent)22" : "var(--surface2)",
                      border: `2px solid ${isDone ? "var(--accent)" : "var(--border)"}`,
                      flexShrink: 0
                    }}>
                      {isDone ? step.icon : <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--border)", display: "block" }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "var(--accent)" : isDone ? "var(--text)" : "var(--muted)", fontSize: "0.95rem" }}>
                        {step.label}
                      </div>
                      {isCurrent && <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.2rem" }}>{step.desc}</div>}
                    </div>
                    {isCurrent && (
                      <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1.5s infinite" }} />
                    )}
                  </div>
                );
              })}
              {q.status === 'rejected' && (
                <div style={{ padding: "1.25rem", textAlign: "center", color: "#ef4444" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>❌</div>
                  <div style={{ fontWeight: 700 }}>Cotação Recusada</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>Entre em contato conosco para uma nova proposta.</div>
                </div>
              )}
            </div>
          )}

          {/* ── Tracking Info Display ── */}
          {q.shipping_tracking_code && (
            <div className="card" style={{ marginTop: "2rem", padding: "1.5rem", border: "2px solid #3b82f6", background: "#eff6ff" }}>
              <h3 style={{ fontSize: "1rem", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🚚</span> Acompanhe sua Entrega
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#1e40af", marginBottom: "1rem", lineHeight: 1.4 }}>
                Seu pedido possui um código de rastreamento. Utilize o código abaixo no site da transportadora:
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  readOnly
                  value={q.shipping_tracking_code}
                  className="input"
                  style={{ flex: 1, background: "white", borderColor: "#bfdbfe", color: "#1e3a8a", fontWeight: 700, fontSize: "1rem", textAlign: "center" }}
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <button
                  className="btn btn-primary"
                  style={{ background: "#3b82f6" }}
                  onClick={() => {
                    navigator.clipboard.writeText(q.shipping_tracking_code);
                    alert("Código de rastreio copiado!");
                  }}
                >
                  Copiar
                </button>
              </div>
            </div>
          )}

          {/* ── NFe Display ── */}
          {q.nfe_url && (
            <div className="card" style={{ marginTop: "1rem", padding: "1.5rem", border: "2px solid #0ea5e9", background: "#f0f9ff", textAlign: "center" }}>
              <h3 style={{ fontSize: "1rem", color: "#0369a1", textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span>🧾</span> Nota Fiscal Disponível
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#0c4a6e", marginBottom: "1rem", lineHeight: 1.4 }}>
                Sua Nota Fiscal eletrônica referente a este serviço foi emitida com sucesso.
              </p>
              <a href={q.nfe_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn" style={{ background: "#0ea5e9", color: "white", padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: 700, borderRadius: 8, width: "100%", border: "none" }}>
                  Baixar Documento (PDF/XML)
                </button>
              </a>
            </div>
          )}

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <AnimatedDownloadButton
              onClick={handleDownloadPdf}
              labels={[t('actions.download_pdf'), t('actions.processing'), "Abrir PDF"]}
            />
          </div>

          {q.config?.enable_chat && (
            <div style={{ marginTop: "3rem" }}>
              <ChatBox quoteId={q.id} token={token} currentUserType="client" />
            </div>
          )}
        </section>

        {/* Right: Summary */}
        <aside>
          <div className="card" style={{ padding: "1.5rem", position: "sticky", top: "2rem", border: "2px solid var(--accent)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1.5rem", textAlign: "center" }}>{t('summary.title')}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--muted)" }}>{t('summary.quantity')}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700 }}>{q.quantity} {t('quote.unit')}</span>
                  {(q.status === 'quoted') && (
                    <button
                      onClick={() => { setNewQty(q.quantity || 1); setShowQuantityMod(true); }}
                      style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.3rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}
                      title="Alterar Quantidade"
                    >
                      Editar ✏️
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>{t('summary.subtotal')}</span>
                <span style={{ fontWeight: 700 }}>{fmt(subtotalParts)}</span>
              </div>

              {Number(q.discount_value) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border)" }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>🎟️ Desconto (Cupom)</span>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>- {fmt(Number(q.discount_value))}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>🚚 Frete</span>
                <span style={{ fontWeight: 700 }}>
                  {displayShippingPrice > 0 ? fmt(displayShippingPrice) : (selectedShipping?.name === 'carrier_pending' || q?.shipping_service === 'carrier_pending' ? 'A calcular' : 'Grátis')}
                </span>
              </div>

              {taxPct > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "1.25rem", borderBottom: "1px dashed var(--border)" }}>
                  <span style={{ color: "var(--muted)" }}>{t('quote.tax')} ({taxPct}%)</span>
                  <span style={{ fontWeight: 700, color: "#94a3b8" }}>+ {fmt(taxAmount)}</span>
                </div>
              )}

              {appliedCashback > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "1.25rem", borderBottom: "1px dashed var(--border)" }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>🎁 Cashback</span>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>- {fmt(appliedCashback)}</span>
                </div>
              )}

              {!q.coupon_id && ['quoted', 'counter_offer', 'pending'].includes(q.status) && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Cupom de desconto"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="input"
                      style={{ flex: 1, textTransform: "uppercase", padding: "0.75rem" }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="btn"
                      style={{ background: "var(--accent)", color: "white", padding: "0.75rem 1rem", border: "none" }}
                    >
                      {couponLoading ? "..." : "Aplicar"}
                    </button>
                  </div>
                  {couponError && <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.5rem", fontWeight: 600 }}>{couponError}</div>}
                </div>
              )}

              <div style={{ marginTop: "0.5rem", padding: "1.5rem", background: "#3c5077", borderRadius: "12px", textAlign: "center", border: "1px solid #ffffff22" }}>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.4rem" }}>
                  {t('summary.total_lot')}
                </div>
                <div style={{ fontSize: "2.75rem", fontWeight: 900, color: "#22c55e" }}>
                  {fmt(finalPayable)}
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#eab308", marginTop: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.6rem" }}>
                  <span style={{ color: "white" }}>{t('summary.per_unit').toUpperCase()}:</span> {fmt(q.final_price_per_unit)}
                </div>
              </div>

              {q.status === 'pending' || q.status === 'quoted' || (['approved', 'awaiting_payment'].includes(q.status) && !pixData) ? (
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5, marginTop: "1rem" }}>
                  {t('summary.disclaimer')}
                </div>
              ) : null}

              {/* PIX Payment Section */}
              {(() => {
                const needsAddressData = !q.client_name || !q.client_document;
                const needsShippingSave = !q.shipping_service || (selectedShipping && q.shipping_service !== selectedShipping.name);
                const showGreenButton = needsAddressData || needsShippingSave || q.status === 'quoted';

                return ['approved', 'awaiting_payment'].includes(q.status) && !showGreenButton && (
                  <div style={{ marginTop: "1.5rem", borderTop: "1px dashed var(--border)", paddingTop: "1.5rem" }}>
                    {q.is_paid ? (
                      <div style={{ textAlign: "center", padding: "2rem", background: "rgba(34, 197, 94, 0.08)", borderRadius: "16px", border: "2px solid #22c55e33" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
                        <div style={{ fontWeight: 900, color: "#16a34a", fontSize: "1.2rem", letterSpacing: "1px" }}>PAGAMENTO CONFIRMADO</div>
                        <div style={{ fontSize: "0.9rem", color: "#15803d", marginTop: "0.5rem", fontWeight: 600 }}>Oba! Seu pagamento já foi recebido e seu pedido está seguindo o fluxo de produção.</div>
                      </div>
                    ) : !pixData ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <button
                          onClick={handleGeneratePix}
                          disabled={pixLoading || cardLoading}
                          className="btn btn-primary"
                          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", border: "none", background: "#3b82f6", color: "white", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                        >
                          {pixLoading ? "Aguarde..." : (
                            <>
                              <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor">
                                <path d="M242.4 292.5c5.4-5.4 14.7-5.4 20.1 0l77 77c14.2 14.2 33.1 22 53.1 22l15.1 0-97.1 97.1c-30.3 29.5-79.5 29.5-109.8 0l-97.5-97.4 9.3 0c20 0 38.9-7.8 53.1-22l76.7-76.7zm20.1-73.6c-6.4 5.5-14.6 5.6-20.1 0l-76.7-76.7c-14.2-15.1-33.1-22-53.1-22l-9.3 0 97.4-97.4c30.4-30.3 79.6-30.3 109.9 0l97.2 97.1-15.2 0c-20 0-38.9 7.8-53.1 22l-77 77zM112.6 142.7c13.8 0 26.5 5.6 37.1 15.4l76.7 76.7c7.2 6.3 16.6 10.8 26.1 10.8 9.4 0 18.8-4.5 26-10.8l77-77c9.8-9.7 23.3-15.3 37.1-15.3l37.7 0 58.3 58.3c30.3 30.3 30.3 79.5 0 109.8l-58.3 58.3-37.7 0c-13.8 0-27.3-5.6-37.1-15.4l-77-77c-13.9-13.9-38.2-13.9-52.1 .1l-76.7 76.6c-10.6 9.8-23.3 15.4-37.1 15.4l-31.8 0-58-58c-30.3-30.3-30.3-79.5 0-109.8l58-58.1 31.8 0z" />
                              </svg>
                              Pagar com PIX
                            </>
                          )}
                        </button>

                        <button
                          onClick={handlePayWithCard}
                          disabled={pixLoading || cardLoading}
                          className="btn"
                          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", borderRadius: "12px", border: "2px solid #3b82f6", background: "transparent", color: "#3b82f6", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                        >
                          {cardLoading ? "Aguarde..." : (
                            <>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                              Pagar com Cartão
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ color: "#0f172a", fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem" }}>CÓDIGO PIX GERADO</h4>
                        {pixData.qr_code_base64 && (() => {
                          const src = pixData.qr_code_base64.startsWith('data:')
                            ? pixData.qr_code_base64
                            : pixData.qr_code_base64.startsWith('http')
                              ? pixData.qr_code_base64
                              : `data:image/png;base64,${pixData.qr_code_base64}`;
                          return (
                            <img
                              src={src}
                              alt="QR Code PIX"
                              style={{ width: "250px", height: "250px", margin: "0 auto 1.5rem", border: "4px solid white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", display: "block", background: "white" }}
                            />
                          );
                        })()}

                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>PIX Copia e Cola:</div>
                        <textarea
                          readOnly
                          value={pixData.qr_code || ""}
                          onClick={(e) => { (e.target as HTMLTextAreaElement).select(); document.execCommand('copy'); alert('Copiado!'); }}
                          style={{ width: "100%", fontSize: "0.75rem", padding: "0.5rem", wordBreak: "break-all", resize: "none", height: "80px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "white", color: "#334155", cursor: "pointer" }}
                        />
                        <button
                          onClick={() => { navigator.clipboard.writeText(pixData.qr_code); alert('Copiado!'); }}
                          className="btn"
                          style={{ width: "100%", marginTop: "1rem", background: "#3b82f6", color: "white", border: "none" }}
                        >
                          Copiar Código
                        </button>

                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #3b82f6", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Aguardando pagamento...</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </aside>
      </main>

      {/* Quantity Modification Modal */}
      {showQuantityMod && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 400, width: "100%", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text)" }}>Alterar Quantidade</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Para garantir precisão nos custos de frete e no tempo de impressão, alterações de quantidade requerem um recálculo por parte de nossa equipe.<br /><br />
              Confirme a nova quantidade desejada abaixo:
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
              <button
                type="button"
                onClick={() => setNewQty(Math.max(1, newQty - 1))}
                style={{ width: "3rem", height: "3rem", border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "8px", cursor: "pointer", fontSize: "1.5rem", color: "var(--text)", fontWeight: "bold" }}
              >
                -
              </button>
              <input
                type="number"
                className="input"
                style={{ padding: "0.5rem", fontSize: "1.25rem", width: "5rem", textAlign: "center", fontWeight: "bold" }}
                min="1"
                value={newQty || 1}
                onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
              />
              <button
                type="button"
                onClick={() => setNewQty(newQty + 1)}
                style={{ width: "3rem", height: "3rem", border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "8px", cursor: "pointer", fontSize: "1.5rem", color: "var(--text)", fontWeight: "bold" }}
              >
                +
              </button>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                className="btn"
                onClick={() => setShowQuantityMod(false)}
                style={{ flex: 1, padding: "1rem", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "8px" }}
              >
                Cancelar
              </button>
              <button
                className="btn"
                onClick={handleQuantityRequest}
                disabled={actionLoading || newQty === q.quantity}
                style={{ flex: 1, padding: "1rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", opacity: (actionLoading || newQty === q.quantity) ? 0.6 : 1 }}
              >
                {actionLoading ? "Enviando..." : "Solicitar Recálculo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {showCounter && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>{t('actions.counter_offer')}</h3>
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">{t('actions.proposed_price')}</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={counterPrice || ""}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder={`${q.config?.currency_symbol || "R$"} 0,00`}
              />
            </div>
            <div style={{ marginBottom: "2rem" }}>
              <label className="label">{t('actions.notes')}</label>
              <textarea
                className="input"
                style={{ minHeight: 100 }}
                value={notes || ""}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('actions.notes_placeholder')}
              />
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() => handleStatusUpdate('counter_offer')}
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {t('actions.send')}
              </button>
              <button
                onClick={() => setShowCounter(false)}
                className="btn btn-ghost"
                style={{ flex: 1, border: "1px solid var(--border)" }}
              >
                {t('actions.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address / Delivery Details Modal */}
      {showAddressModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 600, width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--text)" }}>📍 Identificação e Entrega</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Para prosseguir com sua cotação e calcularmos o custo final com frete, por favor preencha seus dados básicos e preferência de entrega.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleIdentify(); }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="label">Nome Completo ou Razão Social *</label>
                  <input className="input" type="text" required value={clientName || ""} onChange={e => setClientName(e.target.value)} />
                </div>
                <div>
                  <label className="label">CPF ou CNPJ *</label>
                  <input className="input" type="text" required value={documentNumber || ""} onChange={e => setDocumentNumber(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="label">E-mail *</label>
                  <input className="input" type="email" required value={clientEmail || ""} onChange={e => setClientEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label">Telefone / WhatsApp</label>
                  <input className="input" type="tel" value={clientPhone || ""} onChange={e => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>

              {/* Account creation password fields */}
              {!session?.user && !q.client_id && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", padding: "1rem", background: "rgba(99,102,241,0.06)", borderRadius: "10px", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      🔐 Crie uma senha para proteger sua cotação (opcional)
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                      Com uma senha, apenas você poderá acessar esta cotação futuramente.
                    </div>
                  </div>
                  <div>
                    <label className="label">Senha (mín. 6 caracteres)</label>
                    <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" minLength={6} autoComplete="new-password" />
                  </div>
                  <div>
                    <label className="label">Confirmar Senha</label>
                    <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••" minLength={6} autoComplete="new-password" />
                  </div>
                  {passwordError && (
                    <div style={{ gridColumn: "1 / -1", color: "#ef4444", fontSize: "0.82rem", fontWeight: 600 }}>{passwordError}</div>
                  )}
                </div>
              )}

              <div style={{ padding: "1rem", background: "var(--surface2)", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid var(--border)" }}>
                <label className="label" style={{ fontWeight: 700, marginBottom: "0.75rem", display: "block" }}>🚚 Escolha a forma de recebimento:</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem",
                    background: selectedShipping?.name === 'Retirada em Mãos' ? "#064e3b44" : "var(--surface2)",
                    border: selectedShipping?.name === 'Retirada em Mãos' ? "2px solid #22c55e" : "1px solid var(--border)",
                    borderRadius: "12px", cursor: "pointer", transition: "all 0.2s ease"
                  }}>
                    <input type="radio" name="shipping" checked={selectedShipping?.name === 'Retirada em Mãos'} onChange={() => setSelectedShipping({ name: 'Retirada em Mãos', price: 0 })} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: selectedShipping?.name === 'Retirada em Mãos' ? "#4ade80" : "var(--text)" }}>Retirada em Mãos (Grátis)</div>
                      <div style={{ fontSize: "0.8rem", color: selectedShipping?.name === 'Retirada em Mãos' ? "#86efac" : "var(--muted)" }}>Retire seu pedido diretamente em nossa loja.</div>
                      {selectedShipping?.name === 'Retirada em Mãos' && q.config?.company_address && (
                        <div style={{ marginTop: "0.5rem", padding: "0.5rem", borderLeft: "2px solid #4ade80", background: "rgba(74, 222, 128, 0.05)", fontSize: "0.75rem" }}>
                          <strong>Endereço:</strong> {q.config.company_address}{q.config.company_number ? `, ${q.config.company_number}` : ''}
                          {q.config.company_complement ? ` - ${q.config.company_complement}` : ''}
                          {q.config.company_neighborhood ? `, ${q.config.company_neighborhood}` : ''}
                          , {q.config.company_city} - {q.config.company_state}
                        </div>
                      )}
                    </div>
                  </label>

                  <label style={{
                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem",
                    background: selectedShipping && selectedShipping.name !== 'Retirada em Mãos' ? "#064e3b44" : "var(--surface2)",
                    border: selectedShipping && selectedShipping.name !== 'Retirada em Mãos' ? "2px solid #22c55e" : "1px solid var(--border)",
                    borderRadius: "12px", cursor: "pointer", transition: "all 0.2s ease"
                  }}>
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping && selectedShipping.name !== 'Retirada em Mãos'}
                      onChange={() => setSelectedShipping({ name: 'carrier_pending', price: 0 })}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: selectedShipping && selectedShipping.name !== 'Retirada em Mãos' ? "#4ade80" : "var(--text)" }}>Receber via Correios / Transportadora</div>
                      <div style={{ fontSize: "0.8rem", color: selectedShipping && selectedShipping.name !== 'Retirada em Mãos' ? "#86efac" : "var(--muted)" }}>Enviaremos para o seu endereço (frete a calcular).</div>
                    </div>
                  </label>

                  {(!selectedShipping || selectedShipping.name !== 'Retirada em Mãos') && (
                    <div style={{ padding: "0.5rem 0.75rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                        <div>
                          <label className="label">CEP para Entrega *</label>
                          <input className="input" type="text" required maxLength={9} value={zipcode || ""} onChange={e => setZipcode(e.target.value)} onBlur={e => handleZipcodeBlur(e.target.value)} />
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", paddingBottom: "0.5rem" }}>O frete será calculado com base no CEP informado.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(!selectedShipping || selectedShipping.name !== 'Retirada em Mãos') && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label className="label">Logradouro / Rua *</label>
                      <input className="input" type="text" required value={address || ""} onChange={e => setAddress(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label className="label">Número *</label>
                      <input className="input" type="text" required value={addressNumber || ""} onChange={e => setAddressNumber(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Complemento</label>
                      <input className="input" type="text" placeholder="Apto, Bloco, etc" value={addressComp || ""} onChange={e => setAddressComp(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "1rem", marginBottom: "2rem" }}>
                    <div>
                      <label className="label">Bairro *</label>
                      <input className="input" type="text" required value={neighborhood || ""} onChange={e => setNeighborhood(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Cidade *</label>
                      <input className="input" type="text" required value={city || ""} onChange={e => setCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Estado *</label>
                      <input className="input" type="text" required maxLength={2} value={stateCode || ""} onChange={e => setStateCode(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                {!q.client_name ? null : (
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="btn"
                    style={{
                      flex: 1, padding: "1.25rem", borderRadius: "12px",
                      fontWeight: 700, border: "1px solid var(--border)",
                      background: "var(--surface2)", color: "var(--text)",
                      transition: "all 0.2s"
                    }}
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={actionLoading || !selectedShipping || (selectedShipping.name === 'carrier_pending' && zipcode.replace(/\D/g, "").length < 8)}
                  className="btn"
                  style={{
                    flex: 2, padding: "1.25rem", borderRadius: "12px",
                    fontSize: "1rem", fontWeight: 800, border: "none",
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "white", cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(34, 197, 94, 0.25)",
                    transition: "all 0.2s",
                    opacity: (actionLoading || !selectedShipping) ? 0.6 : 1
                  }}
                >
                  {actionLoading ? "Processando..." : (
                    <>
                      Continuar Pagamento
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "0.5rem" }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AiChatWidget quoteId={q?.id} token={token} />
    </div>
  );
}
