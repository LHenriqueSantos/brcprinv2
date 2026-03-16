"use client";

import { use } from "react";
import Link from "next/link";

export default function CheckoutCancelPage({ params }: any) {
  const unwrappedParams = use(params) as any;
  const token = unwrappedParams.token;

  return (
    <div style={{ maxWidth: 600, margin: "auto", textAlign: "center", paddingTop: "4rem" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", margin: "0 0 1rem" }}>Pagamento Cancelado</h1>
      <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>
        Você cancelou o processo de pagamento. A sua cotação não será aprovada até que o pagamento seja finalizado.
      </p>

      <div style={{ marginTop: "2rem" }}>
        <Link href={`/portal/${token}`}>
          <button className="btn btn-ghost" style={{ padding: "0.75rem 2rem", fontSize: "1.1rem" }}>
            Voltar para a Cotação
          </button>
        </Link>
      </div>
    </div>
  );
}
