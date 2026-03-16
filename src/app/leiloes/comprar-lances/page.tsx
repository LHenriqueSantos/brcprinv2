"use client";

import { useState, useEffect } from "react";
import { Gavel, Copy, Check, QrCode, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AiChatWidget from "@/components/AiChatWidget";

export default function ComprarLancesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Checkout flow state
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState<any>(null);

  useEffect(() => {
    fetch("/api/leiloes/pacotes")
      .then(r => r.json())
      .then(data => {
        setPackages(data);
        setLoading(false);
      });
  }, []);

  const handleBuy = async (pkg: any) => {
    if (status !== "authenticated") {
      router.push(`/cliente/login?callbackUrl=/leiloes/comprar-lances`);
      return;
    }

    setSelectedPkg(pkg);
    setIsProcessing(true);
    setPixData(null);
    if (paymentPolling) clearInterval(paymentPolling);

    try {
      const res = await fetch("/api/leiloes/pacotes/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id })
      });
      const data = await res.json();

      if (res.ok) {
        setPixData(data);
        startPolling(data.purchaseId);
      } else {
        alert(data.error || "Falha ao gerar o Pix. Verifique se o MercadoPago está ativo nas Configurações do Admin.");
        setSelectedPkg(null);
      }
    } catch (e) {
      console.error(e);
      alert("Erro de comunicação com o servidor.");
      setSelectedPkg(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const startPolling = (purchaseId: number) => {
    // A short poll to verify if the bid purchase is approved
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/leiloes/pacotes/status/${purchaseId}`);
        if (res.ok) {
          const { status } = await res.json();
          if (status === 'approved') {
            clearInterval(interval);
            alert("Compra aprovada! Lances creditados.");
            // Redirect back to auctions
            router.push("/leiloes");
          }
        }
      } catch (e) { }
    }, 4000);
    setPaymentPolling(interval);
  };

  const copyToClipboard = () => {
    if (!pixData?.qr_code) return;
    navigator.clipboard.writeText(pixData.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Header Público */}
      {status !== "authenticated" && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 2rem",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            background: "rgba(10, 10, 10, 0.8)",
            backdropFilter: "blur(12px)",
            zIndex: 100
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/brcprint.svg" alt="BRCPrint" style={{ height: "30px", objectFit: "contain" }} />
          </Link>
          <nav className="nav-links">
            <Link href="/leiloes" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 700 }}>⬅ Voltar aos Leilões</Link>
          </nav>
        </header>
      )}

      <main style={{ flex: 1, padding: "4rem 2rem", maxWidth: 1000, margin: "0 auto", width: "100%" }}>

        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1.2rem", borderRadius: "999px", background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", fontWeight: 800, fontSize: "0.9rem", marginBottom: "1rem", border: "1px solid rgba(59, 130, 246, 0.4)" }}>
            <Layers size={16} /> Pacotes de Lances
          </div>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 900, marginBottom: "1rem" }}>Recarregue sua Balança.</h1>
          <p style={{ color: "var(--muted)", maxWidth: 600, margin: "0 auto", fontSize: "1.1rem" }}>
            Os lances adquiridos não expiram e não possuem mensalidade. Escolha o melhor pacote para você e parta para o arremate final.
          </p>
        </div>

        {pixData ? (
          <div className="card animate-fade-in-up" style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", border: "2px solid #10b981" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem", color: "#10b981" }}>Pagamento Via Pix</h2>
            <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
              Pacote <strong>{selectedPkg.name} ({selectedPkg.bids_amount} Lances)</strong> por R$ {Number(selectedPkg.price).toFixed(2).replace('.', ',')}
            </p>

            <div style={{ background: "#fff", padding: "1rem", borderRadius: "12px", display: "inline-block", marginBottom: "1.5rem" }}>
              <img src={pixData.qr_code_base64} alt="QR Code Pix" style={{ width: 180, height: 180 }} />
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 0.5rem" }}>Pix Copia e Cola:</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input type="text" value={pixData.qr_code} readOnly className="input" style={{ flex: 1, fontFamily: "monospace", fontSize: "0.8rem", background: "var(--surface2)" }} />
              <button onClick={copyToClipboard} className="btn btn-primary" style={{ padding: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div style={{ marginTop: "2rem", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: "var(--muted)", fontSize: "0.85rem", fontWeight: 600 }}>
              <RefreshCw size={14} className="spin-fast" /> Aguardando compensação do Banco Central...
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
            {loading ? (
              <div style={{ color: "var(--muted)", padding: "2rem" }}>Carregando pacotes...</div>
            ) : packages.length === 0 ? (
              <div style={{ color: "var(--muted)", padding: "2rem" }}>Nenhum pacote configurado.</div>
            ) : (
              packages.map(pkg => (
                <div key={pkg.id} className="card hover-glow" style={{ width: "300px", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", border: "1px solid var(--border)", background: "var(--surface)" }}>
                  <div style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", padding: "1rem", borderRadius: "50%", marginBottom: "1.5rem" }}>
                    <Gavel size={32} />
                  </div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "var(--text)" }}>{pkg.name}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>Receba {pkg.bids_amount} lances na sua carteira digital.</p>

                  <div style={{ margin: "2rem 0" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--text)" }}>R$ {Number(pkg.price).toFixed(2).replace('.', ',')}</span>
                  </div>

                  <button
                    onClick={() => handleBuy(pkg)}
                    disabled={isProcessing && selectedPkg?.id === pkg.id}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "1rem", borderRadius: "12px", fontSize: "1rem", fontWeight: 700, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                  >
                    {isProcessing && selectedPkg?.id === pkg.id ? "Gerando Pix..." : <><QrCode size={18} /> Comprar Agora</>}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <AiChatWidget mode="public" />
    </div>
  );
}
