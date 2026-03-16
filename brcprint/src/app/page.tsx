import Link from "next/link";
import pool from "@/lib/db";
import Hero3DScene from "@/components/Hero3DScene";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let reviews: any[] = [];
  try {
    const [rows]: any = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.photo_url, c.name as client_name
      FROM reviews r
      JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT 6
    `);
    reviews = rows;
  } catch (err) {
    console.error("Erro ao puxar reviews:", err);
  }

  return (
    <div className="bg-mesh-dark" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navbar Minimalista */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.5rem 2rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg,#6c63ff,#ff6584)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
            }}
          >
            🖨️
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text)" }}>
            brcprint
          </div>
        </div>
        <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href="/catalogo" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700, transition: "color 0.2s" }}>Catálogo / Loja</Link>
          <Link href="#servicos" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}>Serviços</Link>
          <Link href="#como-funciona" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}>Como Funciona</Link>
          <Link href="/login" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }}>Admin Login</Link>
          <Link href="/cliente/login" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
            Portal do Cliente
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6rem 4rem",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          minHeight: "80vh"
        }}
      >
        <div style={{ flex: 1, paddingRight: "2rem" }} className="animate-fade-in-up">
          <div style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "999px", background: "rgba(108, 99, 255, 0.1)", color: "var(--accent)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "1.5rem", border: "1px solid rgba(108, 99, 255, 0.2)" }}>
            ✨ Bem-vindo ao futuro da Impressão 3D
          </div>
          <h1 style={{ fontSize: "4.5rem", fontWeight: 900, marginBottom: "1.5rem", lineHeight: 1.1 }} className="gradient-text">
            Sua Print Farm,<br />100% Automatizada.
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--muted)", marginBottom: "3rem", lineHeight: 1.6, maxWidth: 600 }}>
            Do primeiro orçamento até o envio do G-Code via rede local.
            Uma plataforma Whitelabel para você gerenciar clientes, pagamentos e IoT em um só lugar.
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/cliente/login" className="btn btn-primary hover-glow" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem", borderRadius: "50px" }}>
              Começar Agora 🚀
            </Link>
            <Link href="#funcionalidades" className="btn btn-ghost" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem", borderRadius: "50px", border: "1px solid rgba(255,255,255,0.1)" }}>
              Ver Funcionalidades
            </Link>
          </div>

          <div style={{ display: "flex", gap: "2rem", marginTop: "3rem", color: "var(--muted)", fontSize: "0.9rem", fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>✅ Checkout PIX</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>✅ Portal Whitelabel</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>✅ OctoPrint API</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", animationDelay: "0.2s" }} className="animate-fade-in-up">
          <Hero3DScene />
        </div>
      </section>

      {/* Como Funciona / Web-to-Print */}
      <section id="como-funciona" style={{ padding: "8rem 2rem", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.3), transparent)" }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "4rem" }} className="animate-fade-in-up">Como Solicitar sua Peça</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", animationDelay: "0.1s" }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(108, 99, 255, 0.15)", color: "#6c63ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "1.5rem", border: "1px solid rgba(108, 99, 255, 0.3)" }}>
                📁
              </div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 700 }}>Envie seu Arquivo</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>Crie sua conta no Portal do Cliente e faça o upload seguro do seu modelo 3D (.STL, .OBJ).</p>
            </div>

            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", animationDelay: "0.2s" }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(255, 101, 132, 0.15)", color: "#ff6584", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "1.5rem", border: "1px solid rgba(255, 101, 132, 0.3)" }}>
                ⚙️
              </div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 700 }}>Escolha o Material</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>PLA, PETG ou ABS? Especifique cor e resistência. Nossos algoritmos calculam o peso.</p>
            </div>

            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", animationDelay: "0.3s" }}>
              <div style={{ position: "absolute", top: -12, right: -12, background: "var(--accent)", color: "white", padding: "0.4rem 1rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 800, boxShadow: "0 4px 10px rgba(108,99,255,0.4)" }}>Automático</div>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "1.5rem", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                💳
              </div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 700 }}>Aprove e Pague</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>Aprove online via Pix ou Cartão. O sistema movimenta o pedido direto pra fábrica sozinho!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades (Features) do BRCPrint */}
      <section id="funcionalidades" style={{ padding: "8rem 2rem", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.3), transparent)" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem" }}>Tecnologia de Ponta para Impressão 3D</h2>
            <p style={{ color: "var(--muted)", fontSize: "1.1rem", maxWidth: 700, margin: "0 auto" }}>
              Nossa plataforma não é apenas um orçador. É um ecossistema completo para gerenciar toda a esteira de produção.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {/* CRM Kanban */}
            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid #6c63ff" }}>
              <div style={{ fontSize: "2.5rem" }}>📋</div>
              <h3 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 700 }}>CRM & Kanban</h3>
              <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Gerencie todos os seus orçamentos e pedidos em um painel visual super ágil. Arraste as peças entre as fases de aprovação sem complicação.
              </p>
            </div>

            {/* Integração IoT */}
            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid #3b82f6", animationDelay: "0.1s" }}>
              <div style={{ fontSize: "2.5rem" }}>📡</div>
              <h3 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 700 }}>Integração IoT Direta</h3>
              <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Conecte a plataforma às suas impressoras (OctoPrint/Moonraker). Envie arquivos G-Code pelo painel web direto pra máquina.
              </p>
            </div>

            {/* Pagamentos Embutidos */}
            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid #10b981", animationDelay: "0.2s" }}>
              <div style={{ fontSize: "2.5rem" }}>💸</div>
              <h3 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 700 }}>Checkout API Integrado</h3>
              <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Orçamentos geram links de cobrança nativos (MercadoPago / Stripe). O sistema detecta o pagamento PIX e aprova as peças sozinho.
              </p>
            </div>

            {/* Portal do Cliente */}
            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid #f59e0b", animationDelay: "0.3s" }}>
              <div style={{ fontSize: "2.5rem" }}>🌐</div>
              <h3 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 700 }}>Portal do Cliente (B2B)</h3>
              <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Área logada White-Label para seu cliente aceitar a Cotação, ver as notas, aprovar layout e baixar a Nota Fiscal / PDFs Seguros.
              </p>
            </div>

            {/* Automação WhatsApp */}
            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid #22c55e", animationDelay: "0.4s" }}>
              <div style={{ fontSize: "2.5rem" }}>💬</div>
              <h3 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 700 }}>Notificação no Zap</h3>
              <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Conectado com Z-API ou Evolution, enviamos mensagens pró ativas com links pra avisar quando o pedido sair para a entrega.
              </p>
            </div>

            {/* Fidelidade e Cashback */}
            <div className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid #eab308", animationDelay: "0.5s" }}>
              <div style={{ fontSize: "2.5rem" }}>🎁</div>
              <h3 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 700 }}>Fidelidade Magnética</h3>
              <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Programa de Cashback embutido. Ao concluir um pedido, o cliente ganha "Moedas" que dão desconto imediato no próximo Pix de forma automática.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avaliações Públicas (UGC) */}
      {reviews.length > 0 && (
        <section id="avaliacoes" style={{ padding: "8rem 2rem", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.3), transparent)" }} />
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }} className="animate-fade-in-up">
              <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem" }}>Depoimentos e Vitrine</h2>
              <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>Galeria de peças impressas e avaliadas por quem confia no BRCPrint.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {reviews.map((r, index) => (
                <div key={r.id} className="card glass-panel hover-glow animate-fade-in-up" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", animationDelay: `${0.1 * index}s` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{r.client_name}</div>
                    <div style={{ color: "#fbbf24", fontSize: "1.4rem", textShadow: "0 0 10px rgba(251, 191, 36, 0.3)" }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </div>
                  </div>

                  {r.photo_url && (
                    <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
                      <img src={r.photo_url} alt={`Peça de ${r.client_name}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  {r.comment && (
                    <p style={{ fontStyle: "italic", color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ padding: "2rem", textAlign: "center", borderTop: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.85rem" }}>
        © {new Date().getFullYear()} BRCPrint. Todos os direitos reservados. Sistema interno de cotação e impressão 3D em tempo real.
      </footer>
    </div>
  );
}
