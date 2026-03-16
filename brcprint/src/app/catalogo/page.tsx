import Link from "next/link";
import { ArrowLeft, Box } from "lucide-react";

async function getCatalogItems() {
  try {
    const res = await fetch("http://localhost:3000/api/catalog", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function PublicCatalogPage() {
  const items = await getCatalogItems();

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "4rem" }}>
      {/* Navbar Simple */}
      <header style={{ padding: "1.5rem 2rem", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "1.2rem" }}>
            <Box size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 900, margin: 0 }}>Catálogo 3D</h1>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Produtos prontos para fabricação</p>
          </div>
        </div>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Voltar ao Início
        </Link>
      </header>

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
            {items.map((item: any) => (
              <Link href={`/catalogo/${item.id}`} key={item.id} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div
                  className="card"
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column"
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
                    {item.category && (
                      <span style={{ position: "absolute", top: "1rem", left: "1rem", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 }}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 800 }}>{item.title}</h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 1.5rem", flex: 1, lineHeight: 1.5 }}>
                      {item.description ? (item.description.length > 100 ? item.description.substring(0, 100) + "..." : item.description) : ""}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>A PARTIR DE</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent)" }}>
                          R$ {Number(item.base_price).toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      <div style={{ background: "var(--surface2)", color: "var(--text)", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}>
                        Detalhes →
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
