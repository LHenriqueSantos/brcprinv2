"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutSuccessPage({ params, searchParams }: any) {
  // Unwrap Next.js 15+ promise params
  const unwrappedParams = use(params) as any;
  const token = unwrappedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // We would normally verify the session_id with Stripe here.
    // For this POC, we'll optimistically update the quote status to in_production.
    const verifyAndApprove = async () => {
      try {
        await fetch(`/api/quotes/by-token/${token}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_production" }),
        });
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    };
    verifyAndApprove();
  }, [token]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", textAlign: "center", paddingTop: "4rem" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", margin: "0 0 1rem" }}>Pagamento Confirmado!</h1>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Validando a sessão...</p>
      ) : error ? (
        <div style={{ background: "#ff658422", border: "1px solid #ff658455", padding: "1rem", borderRadius: 12 }}>
          ⚠️ Um erro ocorreu ao processar o aviso de pagamento. Mas não se preocupe, nosso suporte resolverá isso.
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>
          Sua impressão 3D já está na nossa fila de produção. Você receberá atualizações em breve!
        </p>
      )}

      <div style={{ marginTop: "2rem" }}>
        <Link href={`/portal/${token}`}>
          <button className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.1rem" }}>
            Acompanhar Pedido
          </button>
        </Link>
      </div>
    </div>
  );
}
