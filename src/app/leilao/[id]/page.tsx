import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { Clock, Tag, Box, Scale, Video, ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuctionDetailClient from "@/components/AuctionDetailClient";

export const dynamic = 'force-dynamic';

export default async function AuctionDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isLogged = !!session;

  const [rows]: any = await query(`
    SELECT * FROM auction_items WHERE id = ?
  `, [id]);

  if (!rows || rows.length === 0) {
    return notFound();
  }

  const item = rows[0];
  const mainImage = item.image_url || "/placeholder-item.png";
  let additionalImages: string[] = [];
  try {
    if (item.additional_images) {
      additionalImages = JSON.parse(item.additional_images);
    }
  } catch (e) { }

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Header Público */}
      {!isLogged && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem 2rem",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            background: "rgba(10, 10, 10, 0.8)",
            backdropFilter: "blur(12px)",
            zIndex: 100
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link href="/">
              <img src="/brcprint.svg" alt="BRCPrint Logo" style={{ height: "40px", objectFit: "contain" }} />
            </Link>
          </div>
          <nav className="nav-links">
            <Link href="/catalogo" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700, transition: "color 0.2s" }} className="hover-glow-text">Produtos</Link>
            <Link href="/modelos-parametricos" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Customizáveis</Link>
            <Link href="/leiloes" style={{ color: "#eab308", textDecoration: "none", fontWeight: 700, transition: "color 0.2s" }} className="hover-glow-text">🔨 Leilões Diários</Link>

            <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 0.5rem" }} />

            <Link href="/carrinho" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }} className="hover-glow-text">
              <ShoppingCart size={18} /> Carrinho
            </Link>

            <Link href="/cliente/login" className="btn btn-primary shadow-glow" style={{ padding: "0.6rem 1.2rem", fontSize: "0.95rem", borderRadius: "8px" }}>
              Acessar Sistema
            </Link>
          </nav>
        </header>
      )}

      <main className="container" style={{ padding: "4rem 1.5rem", flex: 1, margin: "0 auto", maxWidth: 1200, width: "100%" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", marginBottom: "2rem" }}>
          <ArrowLeft size={18} /> Voltar para o Feed Principal
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}>

          {/* Lado Esquerdo: Área Visual do Produto */}
          <div>
            <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden", aspectRatio: "1/1", position: "relative" }}>
              <Image src={mainImage} alt={item.title} fill style={{ objectFit: 'contain', padding: '1rem' }} />
              {item.status === 'active' && (
                <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(239, 68, 68, 0.9)", color: "white", padding: "0.4rem 1rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", backdropFilter: "blur(4px)" }}>
                  <div className="pulse-dot"></div> AO VIVO
                </div>
              )}
            </div>

            {/* Galeria de Fotos */}
            {additionalImages.length > 0 && (
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {[mainImage, ...additionalImages].map((img, idx) => (
                  <div key={idx} style={{ flexShrink: 0, width: "80px", height: "80px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", background: "var(--surface)", position: "relative" }}>
                    <Image src={img} alt={`Thumb ${idx}`} fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Especificações Técnicas */}
            <div style={{ marginTop: "2rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)" }}>
                <Box size={20} className="text-primary" /> Especificações Técnicas
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {item.weight && (
                  <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Peso Unitário</span>
                    <span style={{ fontWeight: "600", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Scale size={16} /> {item.weight}
                    </span>
                  </div>
                )}
                {item.dimensions && (
                  <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Dimensões</span>
                    <span style={{ fontWeight: "600", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Box size={16} /> {item.dimensions}
                    </span>
                  </div>
                )}
              </div>
              {!item.weight && !item.dimensions && <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>O Fabricante não detalhou as dimensões deste lote promocional.</p>}
            </div>
          </div>

          {/* Lado Direito: Ações e Detalhes Base */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: "2.5rem", fontWeight: "800", margin: "0 0 0.5rem 0", lineHeight: 1.1, color: "var(--text)" }}>
                {item.title}
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "1.1rem", lineHeight: 1.6 }}>
                {item.description}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem", fontWeight: "600", color: "var(--accent)" }}>
              <Tag size={24} /> Valor Real Lojista: {formatCurrency(item.retail_value)}
            </div>

            <hr style={{ borderColor: "var(--border)", opacity: 0.5 }} />

            {/* Quadro de Ação Rápida (Client Component c/ Timer Polling) */}
            <AuctionDetailClient initialAuction={item} />

            {/* Embed do Video Explicativo */}
            {item.video_url && (
              <div style={{ marginTop: "1rem", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
                <div style={{ background: "var(--surface)", padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Video size={18} className="text-secondary" /> <span style={{ fontWeight: "600" }}>Review em Vídeo</span>
                </div>
                {/* Player placeholder: Se for YouTube dá pra embedar, mas para simplificar colocaremos um banner link */}
                <a href={item.video_url} target="_blank" rel="noreferrer" style={{ display: "block", background: "rgba(0,0,0,0.5)", padding: "2rem", textAlign: "center", color: "white", textDecoration: "none", backgroundImage: "url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=700&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }}>
                  <div style={{ background: "rgba(0,0,0,0.7)", padding: "1rem", display: "inline-block", borderRadius: "50%", backdropFilter: "blur(4px)", marginBottom: "1rem" }}>
                    <Video size={48} color="var(--accent)" />
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "1.2rem", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>Assistir Demonstração do Produto</div>
                </a>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
