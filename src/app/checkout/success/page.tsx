"use client";

import { useEffect, Suspense } from "react";
import { useCart } from "@/store/cartStore";
import { CheckCircle2, Package, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    // Clear cart only on successful load
    clearCart();
  }, [clearCart]);

  return (
    <div style={{ maxWidth: 600, margin: "4rem auto", padding: "2rem", textAlign: "center" }}>
      <div style={{ display: "inline-block", padding: "1.5rem", background: "rgba(34, 197, 94, 0.1)", borderRadius: "50%", marginBottom: "1.5rem" }}>
        <CheckCircle2 size={64} color="var(--green)" />
      </div>

      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem" }}>Pedido Confirmado!</h1>
      <p style={{ color: "var(--muted)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
        Obrigado por sua compra! Seu pedido <strong>#{orderId}</strong> foi recebido com sucesso e estamos preparando tudo para a produção.
      </p>

      <div style={{ background: "var(--surface2)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)", marginBottom: "2.5rem", textAlign: "left" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>O que acontece agora?</h3>
        <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: 0, listStyle: "none" }}>
          <li style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div style={{ color: "var(--accent)", marginTop: "0.2rem" }}><Package size={20} /></div>
            <div>
              <div style={{ fontWeight: 700 }}>Confirmação por E-mail</div>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Você receberá um e-mail com todos os detalhes e o resumo dos itens.</div>
            </div>
          </li>
          <li style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div style={{ color: "var(--accent)", marginTop: "0.2rem" }}><CheckCircle2 size={20} /></div>
            <div>
              <div style={{ fontWeight: 700 }}>Início da Produção</div>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Assim que o Mercado Pago confirmar o pagamento, suas peças entrarão na fila de impressão.</div>
            </div>
          </li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link href="/admin/orders" className="btn btn-primary" style={{ padding: "0.8rem 1.5rem" }}>
          <User size={18} /> Ver Meus Pedidos
        </Link>
        <Link href="/catalogo" className="btn" style={{ background: "transparent", border: "1px solid var(--border)", padding: "0.8rem 1.5rem" }}>
          Continuar Comprando <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
