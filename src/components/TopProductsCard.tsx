import React from 'react';

interface TopProduct {
  title: string;
  total_sold: number;
  revenue: number;
}

interface TopProductsCardProps {
  products: TopProduct[];
}

export default function TopProductsCard({ products }: TopProductsCardProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🔥</span> Mais Vendidos (Loja)
      </h3>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {products.map((product, index) => (
          <div key={index} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem",
            background: "var(--bg-main)",
            borderRadius: "8px",
            border: "1px solid var(--border-color)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "var(--accent)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.8rem"
              }}>
                {index + 1}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>
                  {product.title}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.1rem" }}>
                  {Number(product.total_sold)} un. vendidas
                </div>
              </div>
            </div>
            <div style={{ fontWeight: 700, color: "var(--green)", fontSize: "0.9rem" }}>
              {Number(product.revenue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
