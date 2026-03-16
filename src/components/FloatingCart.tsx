"use client";

import { useCart } from "@/store/cartStore";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function FloatingCart() {
  const { totalItems, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || totalItems === 0) return null;

  return (
    <Link href="/carrinho" style={{ textDecoration: "none" }}>
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          background: "var(--accent)",
          color: "white",
          borderRadius: "50px",
          padding: "0.8rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "0 10px 25px rgba(108, 99, 255, 0.4)",
          zIndex: 9999,
          cursor: "pointer",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <div style={{ position: "relative" }}>
          <ShoppingCart size={24} />
          <span
            style={{
              position: "absolute",
              top: "-8px",
              right: "-12px",
              background: "#ef4444",
              color: "white",
              fontSize: "0.75rem",
              fontWeight: 800,
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {totalItems}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.9 }}>Ver Carrinho</span>
          <span style={{ fontSize: "1rem", fontWeight: 800 }}>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>
    </Link>
  );
}
