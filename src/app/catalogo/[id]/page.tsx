import Link from "next/link";
import { ArrowLeft, Box, ShoppingCart } from "lucide-react";
import CatalogItemClient from "./CatalogItemClient";

async function getCatalogItem(id: string) {
  try {
    // We fetch all active items and find the one. For a real app, a dedicated GET /api/catalog/[id] would be better, but we re-use the list.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://brcprint.com.br";
    const res = await fetch(`${baseUrl}/api/catalog`, { cache: "no-store" });
    if (!res.ok) return null;
    const items = await res.json();
    return items.find((i: any) => i.id.toString() === id) || null;
  } catch (e) {
    return null;
  }
}

export default async function CatalogItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCatalogItem(id);

  if (!item) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--text)" }}>
        <h2>Item não encontrado ou inativo.</h2>
        <Link href="/catalogo" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>Voltar ao Catálogo</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Navbar Simple */}
      <header style={{ padding: "1.5rem 2rem", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/catalogo" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Voltar à Galeria
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/carrinho" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }} className="hover-glow-text">
            <ShoppingCart size={18} /> Carrinho
          </Link>
          <div style={{ fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem", paddingLeft: "1rem", borderLeft: "1px solid var(--border)" }}>
            <Box size={18} /> brcprint
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <CatalogItemClient item={item} />
        </div>
      </main>
    </div>
  );
}
