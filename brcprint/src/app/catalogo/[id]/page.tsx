import Link from "next/link";
import { ArrowLeft, CheckCircle2, Box, Info } from "lucide-react";
import ModelViewer from "@/components/ModelViewer";
import DigitalPurchaseFlow from "@/components/DigitalPurchaseFlow";

async function getCatalogItem(id: string) {
  try {
    // We fetch all active items and find the one. For a real app, a dedicated GET /api/catalog/[id] would be better, but we re-use the list.
    const res = await fetch("http://localhost:3000/api/catalog", { cache: "no-store" });
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
      <header style={{ padding: "1.5rem 2rem", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/catalogo" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Voltar à Galeria
        </Link>
        <div style={{ fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Box size={18} /> brcprint
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>

            {/* Esquerda: Visualizador e Imagem */}
            <div style={{ background: "var(--surface2)", position: "relative" }}>
              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Box size={16} /> Pré-visualização 3D Interativa
                </h3>
              </div>
              <div style={{ height: "450px", position: "relative" }}>
                {item.stl_file_url ? (
                  <ModelViewer url={item.stl_file_url} color={item.default_filament_color || "#3b82f6"} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Nenhum modelo 3D disponível</div>
                )}
              </div>
            </div>

            {/* Direita: Detalhes e Compra */}
            <div style={{ padding: "3rem 2.5rem", display: "flex", flexDirection: "column" }}>
              {item.category && (
                <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>
                  {item.category}
                </div>
              )}
              <h1 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0 0 1rem", lineHeight: 1.1 }}>{item.title}</h1>

              <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text)", marginBottom: "2rem", display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
                R$ {Number(item.base_price).toFixed(2).replace('.', ',')}
                <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--muted)", marginBottom: "0.4rem" }}>preço base sugerido</span>
              </div>

              <div style={{ marginBottom: "2.5rem", fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.7 }}>
                {item.description || "Nenhuma descrição detalhada informada."}
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem" }}>
                <h4 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Info size={16} style={{ color: "var(--accent)" }} /> Informações de Produção
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <li style={{ display: "flex", gap: "0.75rem", fontSize: "0.95rem" }}>
                    <CheckCircle2 size={18} style={{ color: "var(--green)", flexShrink: 0 }} />
                    <span><strong>Impressão Sob Demanda:</strong> A peça será fabricada exclusivamente para você após o pedido.</span>
                  </li>
                  <li style={{ display: "flex", gap: "0.75rem", fontSize: "0.95rem" }}>
                    <CheckCircle2 size={18} style={{ color: "var(--green)", flexShrink: 0 }} />
                    <span><strong>Personalização:</strong> Você poderá escolher a cor e o material na próxima tela antes de fechar o pedido.</span>
                  </li>
                  {item.filament_name && (
                    <li style={{ display: "flex", gap: "0.75rem", fontSize: "0.95rem" }}>
                      <CheckCircle2 size={18} style={{ color: "var(--green)", flexShrink: 0 }} />
                      <span><strong>Recomendação:</strong> O material ideal para esta peça é o <strong>{item.filament_name}</strong>.</span>
                    </li>
                  )}
                </ul>
              </div>

              <div style={{ marginTop: "auto" }}>
                <Link
                  href={`/cliente/novo?catalog_id=${item.id}&stl_url=${encodeURIComponent(item.stl_file_url)}&name=${encodeURIComponent(item.title)}`}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "1.25rem",
                    background: "var(--primary)",
                    color: "white",
                    textAlign: "center",
                    borderRadius: "12px",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 4px 14px 0 rgba(108, 99, 255, 0.39)",
                  }}
                >
                  Confirmar e Orçar Personalização →
                </Link>
                <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted)", margin: "1rem 0 0" }}>
                  Você será redirecionado para a tela de cotação instantânea.
                </p>

                <DigitalPurchaseFlow item={item} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
