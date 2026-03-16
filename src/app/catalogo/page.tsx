import Link from "next/link";
import pool from "@/lib/db";
import { ArrowLeft, Box, ShoppingCart } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming authOptions is here

async function getCatalogItems() {
  try {
    const [standardItems]: any = await pool.query(
      `SELECT c.*, f.name as default_filament_name, f.color as default_filament_color
       FROM catalog_items c
       LEFT JOIN filaments f ON c.filament_id = f.id
       WHERE c.active = 1`
    );

    const [parametricItems]: any = await pool.query(
      `SELECT id, title, description, category, image_url, base_price, created_at
       FROM parametric_models
       WHERE active = 1`
    );

    // Marcar itens para diferenciação
    const items = [
      ...standardItems.map((i: any) => ({ ...i, type: 'standard' })),
      ...parametricItems.map((i: any) => ({ ...i, type: 'parametric' }))
    ];

    return items.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  } catch (e) {
    console.error("Erro ao carregar catálogo:", e);
    return [];
  }
}

export default async function PublicCatalogPage() {
  const items = await getCatalogItems();
  const session = await getServerSession(authOptions);
  const isLogged = !!session;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "4rem" }}>
      {/* Navbar Minimalista (Global) */}
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
            <Link href="/#como-funciona" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Como Funciona</Link>
            <Link href="/#beneficios" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Vantagens</Link>

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

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "1rem", background: "linear-gradient(135deg, white, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Nossa Galeria e Produtos
          </h2>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: 600, margin: "0 auto" }}>
            Navegue pelo nosso portfólio de peças otimizadas para impressão 3D.
            Escolha o modelo, defina a cor e faça seu pedido instantaneamente.
          </p>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted)", background: "var(--surface)", borderRadius: "16px", border: "1px dashed var(--border)" }}>
            <Box size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <p>Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem" }}>
            {items.map((item: any) => {
              const isParametric = item.type === 'parametric';
              const href = isParametric ? `/modelos-parametricos/${item.id}` : `/catalogo/${item.id}`;

              return (
                <Link href={href} key={isParametric ? `p-${item.id}` : `s-${item.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div
                    className="card"
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      cursor: "pointer",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: isParametric ? "1px solid rgba(108, 99, 255, 0.3)" : "1px solid var(--border)",
                      boxShadow: isParametric ? "0 4px 20px rgba(108, 99, 255, 0.1)" : "none"
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", height: "240px", background: "var(--surface2)" }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>
                          <Box size={32} />
                        </div>
                      )}

                      {/* Selos */}
                      <div style={{ position: "absolute", top: "1rem", left: "1rem", display: "flex", gap: "0.5rem" }}>
                        {isParametric && (
                          <span style={{ background: "var(--accent)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", boxShadow: "0 0 10px var(--accent)" }}>
                            Customizável
                          </span>
                        )}
                        {item.category && (
                          <span style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700 }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 800 }}>{item.title}</h3>
                      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 1.5rem", flex: 1, lineHeight: 1.5 }}>
                        {item.description ? (item.description.length > 100 ? item.description.substring(0, 100) + "..." : item.description) : ""}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>A PARTIR DE</div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>
                            R$ {Number(item.base_price).toFixed(2).replace('.', ',')}
                          </div>
                          {item.is_ready_to_ship === 1 && (
                            <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700, marginTop: "0.25rem" }}>✓ Pronta Entrega</div>
                          )}
                          {isParametric && (
                            <div style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 700, marginTop: "0.25rem" }}>✧ Feito para Você</div>
                          )}
                        </div>
                        <div style={{ background: isParametric ? "var(--accent)" : "var(--surface2)", color: isParametric ? "white" : "var(--text)", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}>
                          {isParametric ? "Customizar →" : "Detalhes →"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
