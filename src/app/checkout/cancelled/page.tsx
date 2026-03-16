"use client";

import { XCircle, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CancelledContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div style={{ maxWidth: 600, margin: "4rem auto", padding: "2rem", textAlign: "center" }}>
      <div style={{ display: "inline-block", padding: "1.5rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "50%", marginBottom: "1.5rem" }}>
        <XCircle size={64} color="#ef4444" />
      </div>

      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem" }}>Pagamento Cancelado</h1>
      <p style={{ color: "var(--muted)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
        Parece que houve um problema ou você optou por cancelar o pagamento. Não se preocupe, seu carrinho ainda está esperando por você.
      </p>

      {orderId && (
        <p style={{ marginBottom: "2.5rem", fontSize: "0.9rem", color: "var(--muted)" }}>
          Referência do Pedido Pendente: <strong>#{orderId}</strong>
        </p>
      )}

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link href="/checkout" className="btn btn-primary" style={{ padding: "0.8rem 1.5rem" }}>
          <ArrowLeft size={18} /> Tentar Novamente
        </Link>
        <Link href="/carrinho" className="btn" style={{ background: "transparent", border: "1px solid var(--border)", padding: "0.8rem 1.5rem" }}>
          <ShoppingCart size={18} /> Voltar ao Carrinho
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCancelledPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CancelledContent />
    </Suspense>
  );
}
