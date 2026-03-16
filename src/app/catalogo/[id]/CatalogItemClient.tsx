"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Box, Info, Image as ImageIcon, BoxSelect, ShoppingCart } from "lucide-react";
import ModelViewer from "@/components/ModelViewer";
import DigitalPurchaseFlow from "@/components/DigitalPurchaseFlow";
import { useCart } from "@/store/cartStore";

export default function CatalogItemClient({ item }: { item: any }) {
  const { addItem } = useCart();
  const [viewMode, setViewMode] = useState<"3d" | "photo">("photo");

  // Prepara a lista de imagens
  const allImages = [item.image_url];
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    allImages.push(...item.image_urls);
  }
  const [activeImage, setActiveImage] = useState(allImages[0]);

  const readyStock = Array.isArray(item.ready_stock_details) ? item.ready_stock_details : [];
  const [selectedStock, setSelectedStock] = useState<any | null>(null);

  // Se tem pronta entrega ativa e tem estoque disponível
  const hasReadyStock = item.is_ready_to_ship === 1 && readyStock.length > 0;
  const allowCustomOrder = item.allow_custom_order !== 0; // default true

  const handleStockClick = (stock: any) => {
    setSelectedStock(stock);
    if (stock.image_url) {
      setActiveImage(stock.image_url);
      setViewMode("photo");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
      {/* Esquerda: Visualizador e Imagem */}
      <div style={{ background: "var(--surface2)", position: "relative", display: "flex", flexDirection: "column" }}>

        {/* View Toggles */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <button
            onClick={() => setViewMode("photo")}
            style={{ flex: 1, padding: "1rem", background: viewMode === "photo" ? "var(--surface2)" : "transparent", border: "none", color: viewMode === "photo" ? "var(--accent)" : "var(--muted)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <ImageIcon size={18} /> Fotos
          </button>
          <button
            onClick={() => setViewMode("3d")}
            style={{ flex: 1, padding: "1rem", background: viewMode === "3d" ? "var(--surface2)" : "transparent", border: "none", color: viewMode === "3d" ? "var(--accent)" : "var(--muted)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <Box size={18} /> Modelo 3D Interativo
          </button>
        </div>

        {/* Main Display Area */}
        <div style={{ height: "450px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
          {viewMode === "3d" ? (
            item.stl_file_url ? (
              <ModelViewer url={item.stl_file_url} color={item.default_filament_color || "#3b82f6"} />
            ) : (
              <div style={{ color: "var(--muted)" }}>Nenhum modelo 3D disponível</div>
            )
          ) : (
            <img src={activeImage} alt={item.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          )}
        </div>

        {/* Thumbnails Gallery */}
        {viewMode === "photo" && allImages.length > 1 && (
          <div style={{ padding: "1rem", display: "flex", gap: "0.5rem", overflowX: "auto", borderTop: "1px solid var(--border)" }}>
            {allImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(img)}
                style={{ width: "80px", height: "80px", flexShrink: 0, borderRadius: "8px", border: activeImage === img ? "2px solid var(--accent)" : "2px solid transparent", overflow: "hidden", cursor: "pointer", opacity: activeImage === img ? 1 : 0.6 }}
              >
                <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
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

        {hasReadyStock && (
          <div style={{ marginBottom: "2rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "1.5rem" }}>
            <h4 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BoxSelect size={18} /> Pronta Entrega Disponível!
            </h4>
            <p style={{ color: "var(--text)", fontSize: "0.9rem", marginBottom: "1rem" }}>Temos envio imediato para as seguintes opções:</p>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {readyStock.map((stock: any, idx: number) => {
                const isSelected = selectedStock === stock;
                return (
                  <button
                    key={idx}
                    onClick={() => handleStockClick(stock)}
                    disabled={stock.quantity <= 0}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #10b981" : "2px solid var(--border)",
                      background: isSelected ? "rgba(16, 185, 129, 0.2)" : "var(--surface)",
                      color: stock.quantity <= 0 ? "var(--muted)" : "var(--text)",
                      cursor: stock.quantity <= 0 ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      opacity: stock.quantity <= 0 ? 0.5 : 1,
                      display: "flex", alignItems: "center", gap: "0.5rem"
                    }}
                  >
                    <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", background: "currentColor" }}></span>
                    {stock.color}
                    <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "var(--surface2)", borderRadius: "10px" }}>{stock.quantity} und.</span>
                  </button>
                )
              })}
            </div>

            {selectedStock && (
              <button
                onClick={() => {
                  addItem({
                    type: "ready_stock",
                    catalog_item_id: item.id,
                    title: `${item.title} (${selectedStock.color})`,
                    price: Number(item.base_price),
                    quantity: 1,
                    image_url: selectedStock.image_url || item.image_url,
                    color: selectedStock.color
                  });
                  alert("Estoque adicionado ao carrinho!");
                }}
                style={{
                  display: "block", width: "100%", padding: "1rem", background: "#10b981", color: "white", textAlign: "center",
                  borderRadius: "8px", fontSize: "1rem", fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <ShoppingCart size={20} /> Adicionar {selectedStock.color} ao Carrinho
                </div>
              </button>
            )}
          </div>
        )}

        {allowCustomOrder && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem" }}>
            <h4 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Info size={16} style={{ color: "var(--accent)" }} /> Fabricação Própria (Sob Encomenda)
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <li style={{ display: "flex", gap: "0.75rem", fontSize: "0.95rem" }}>
                <CheckCircle2 size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <span><strong>Sem estoque do seu gosto?</strong> Escolha a cor e material do nosso inventário e nós fabricamos exclusivamente para você.</span>
              </li>
            </ul>
            <Link
              href={`/cliente/novo?catalog_id=${item.id}&stl_url=${encodeURIComponent(item.stl_file_url)}&name=${encodeURIComponent(item.title)}`}
              style={{
                display: "block", width: "100%", padding: "1.25rem", background: "var(--primary)", color: "white", textAlign: "center",
                borderRadius: "12px", fontSize: "1.1rem", fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 14px 0 rgba(108, 99, 255, 0.39)"
              }}
            >
              Orçar Cor/Material Personalizado →
            </Link>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted)", margin: "1rem 0 0" }}>
              Redirecionaremos você para customizar sua peça.
            </p>
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          <DigitalPurchaseFlow item={item} />
        </div>
      </div>
    </div>
  );
}
