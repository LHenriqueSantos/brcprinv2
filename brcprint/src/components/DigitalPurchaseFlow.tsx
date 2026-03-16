"use client";

import { useState, useEffect } from "react";
import { DownloadIcon, CreditCardIcon } from "lucide-react";

export default function DigitalPurchaseFlow({ item }: { item: any }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = Form, 2 = PIX, 3 = Success
  const [form, setForm] = useState({ name: "", email: "" });
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleComprar = () => setModalOpen(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/digital-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog_item_id: item.id,
          client_name: form.name,
          client_email: form.email
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar PIX.");

      setOrder(data);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Poll for payment status
  useEffect(() => {
    let interval: any;
    if (step === 2 && order) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/digital-orders/${order.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'paid') {
              setStep(3);
              clearInterval(interval);
            }
          }
        } catch (e) { }
      }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [step, order]);

  // Simulador de Pagamento Rápido (Somente MVP / Dev)
  const simulatePayment = async () => {
    try {
      await fetch(`/api/digital-orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" })
      });
      setStep(3);
    } catch (e) {
      alert("Erro ao simular pagamento");
    }
  };

  if (!item.is_digital_sale || Number(item.digital_price) <= 0) return null;

  return (
    <>
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={handleComprar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            width: "100%",
            padding: "1rem",
            background: "var(--surface)",
            color: "var(--accent)",
            border: "1px dashed var(--accent)",
            textAlign: "center",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: 800,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseOver={e => e.currentTarget.style.background = "var(--surface2)"}
          onMouseOut={e => e.currentTarget.style.background = "var(--surface)"}
        >
          <CreditCardIcon size={20} />
          Ou Compre o Arquivo Digital (STL) por R$ {Number(item.digital_price).toFixed(2).replace('.', ',')}
        </button>
      </div>

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 450, width: "100%", padding: "2rem", position: "relative" }}>

            {step === 1 && (
              <>
                <button type="button" onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--muted)" }}>&times;</button>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>Comprar Arquivo Digital</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
                  Peça: <strong>{item.title}</strong><br />
                  Preço: <strong style={{ color: "var(--text)" }}>R$ {Number(item.digital_price).toFixed(2)}</strong>
                </p>

                {errorMsg && <div style={{ color: "#ef4444", background: "#fef2f2", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", border: "1px solid #fca5a5" }}>{errorMsg}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label className="label">Como quer ser chamado?</label>
                    <input required type="text" className="input" placeholder="Seu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">E-mail para receiving do link</label>
                    <input required type="email" className="input" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={loading}>
                    {loading ? "Gerando PIX..." : "Gerar PIX e Continuar"}
                  </button>
                </form>
              </>
            )}

            {step === 2 && order && (
              <div style={{ textAlign: "center" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--muted)" }}>&times;</button>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>Pague via PIX Copia e Cola</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
                  Assim que o pagamento for reconhecido, o link vai aparecer aqui e sumir em 24h.
                </p>

                <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px dashed var(--border)", marginBottom: "1.5rem" }}>
                  <code style={{ display: "block", wordBreak: "break-all", background: "var(--background)", padding: "1rem", borderRadius: "8px", fontSize: "0.75rem", userSelect: "all" }}>
                    {order.pixCode}
                  </code>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600 }}>
                  <span className="spinner" style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                  Aguardando confirmação...
                </div>

                <button onClick={simulatePayment} className="btn btn-ghost" style={{ marginTop: "2rem", fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "var(--muted)" }}>
                  (Simulador Dev) Forçar Pagamento
                </button>
              </div>
            )}

            {step === 3 && order && (
              <div style={{ textAlign: "center" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--muted)" }}>&times;</button>
                <div style={{ width: 64, height: 64, background: "rgba(34, 197, 94, 0.1)", color: "var(--green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                  <DownloadIcon size={32} />
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--text)" }}>Pagamento Confirmado!</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 2rem" }}>
                  Seu download digital foi liberado com sucesso. O link abaixo vai expirar em exatamente 24 horas.
                </p>

                <a
                  href={`/api/download-digital/${order.downloadToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem", width: "100%", fontSize: "1.1rem" }}
                  onClick={() => {
                    setTimeout(() => setModalOpen(false), 2000);
                  }}
                >
                  <DownloadIcon size={20} />
                  Baixar Arquivo STL Agora
                </a>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
