"use client";

import { useCart } from "@/store/cartStore";
import Link from "next/link";
import { Trash2, Plus, Minus, Cuboid, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = items.reduce((acc, item) => acc + (Number(item.price) || 0) * item.quantity, 0);

  if (!mounted) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 2rem", textAlign: "center" }}>
        Carregando carrinho...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "1.5rem", background: "var(--surface)", borderRadius: "100%", marginBottom: "1rem" }}>
          <Cuboid size={48} color="var(--accent)" />
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 1rem" }}>Seu Carrinho está Vazio</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
          Você ainda não adicionou nenhum modelo 3D ao seu carrinho de impressão.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link href="/catalogo" className="btn btn-primary">
            Navegar no Catálogo
          </Link>
          <Link href="/cliente/novo" className="btn" style={{ background: "transparent", border: "1px solid var(--border)" }}>
            <UploadCloud size={18} /> Orçar Nova Peça
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem", paddingBottom: "6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Meu Carrinho</h1>
        <button className="btn" style={{ background: "transparent", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }} onClick={clearCart}>
          Esvaziar Carrinho
        </button>
      </div>

      <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "1fr 350px" }}>
        {/* Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map(item => (
            <div key={item.id} style={{ display: "flex", gap: "1.5rem", padding: "1.5rem", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)", alignItems: "center" }}>

              <div style={{ width: 80, height: 80, borderRadius: "8px", background: "rgba(108, 99, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                <Cuboid size={32} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{item.title}</h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)", display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                      <span>💳 R$ {(item.price).toFixed(2)} un.</span>
                      {item.type === 'custom_pod' && item.extras?.material && (
                        <span>⚙️ {item.extras.material}</span>
                      )}
                      {item.color && (
                        <span>🎨 {item.color}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--accent)" }}>
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  {/* Quantity Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--surface)", padding: "0.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      style={{ border: "none", background: "transparent", padding: "0.25rem", cursor: "pointer", display: "flex", color: "var(--text)" }}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: "1.5rem", textAlign: "center", fontSize: "0.95rem" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{ border: "none", background: "transparent", padding: "0.25rem", cursor: "pointer", display: "flex", color: "var(--text)" }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", padding: "0.5rem", borderRadius: "6px", transition: "background 0.2s" }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Trash2 size={18} /> Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Sidebar */}
        <div>
          <div style={{ padding: "1.5rem", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)", position: "sticky", top: "2rem" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 800 }}>Resumo da Compra</h3>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.95rem", color: "var(--muted)" }}>
              <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} itens)</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            <div style={{ height: 1, background: "var(--border)", margin: "1rem 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)" }}>R$ {total.toFixed(2)}</span>
            </div>

            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "1.5rem", textAlign: "center" }}>
              Os custos de frete são calculados durante o checkout no método de entrega escolhido.
            </p>

            <Link href="/checkout" style={{ width: "100%", textDecoration: "none" }}>
              <button className="btn btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", justifyContent: "center" }}>
                Finalizar Compra
              </button>
            </Link>

            <Link href="/catalogo" style={{ display: "block", textAlign: "center", marginTop: "1rem", color: "var(--accent)", fontSize: "0.9rem", fontWeight: 700, textDecoration: "none" }}>
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
