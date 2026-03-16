import Link from "next/link";
import pool from "@/lib/db";
import Hero3DScene from "@/components/Hero3DScene";
import AiChatWidget from "@/components/AiChatWidget";
import SponsorshipLogos from "@/components/SponsorshipLogos";
import GSAPScrollReveal from "@/components/GSAPScrollReveal";
import { ShoppingCart, Zap, Shield, Cpu, Activity, Play, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let reviews: any[] = [];
  let parametricModels: any[] = [];
  let activeAuctions: any[] = [];
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

    const [pRows]: any = await pool.query(`
      SELECT id, title, description, image_url, base_price, category
      FROM parametric_models
      WHERE active = 1
      ORDER BY created_at DESC
      LIMIT 3
    `);
    parametricModels = pRows;

    const [aRows]: any = await pool.query(`
      SELECT id, title, image_url, current_price, end_time, time_increment
      FROM auction_items
      WHERE status = 'active'
      ORDER BY end_time ASC
      LIMIT 3
    `);
    activeAuctions = aRows;
  } catch (err) {
    console.error("Erro ao puxar dados da landing:", err);
  }

  return (
    <div className="bg-mesh-dark" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navbar Minimalista */}
      {/* Navbar Ultra-Futurista */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.8rem 3rem",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "rgba(5, 6, 10, 0.8)",
          backdropFilter: "blur(15px)",
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <img src="/brcprint.svg" alt="brcprint Logo" style={{ height: "42px" }} className="hover:scale-110 transition-all duration-500" />
          <div style={{ width: 2, height: 20, background: "var(--accent)" }}></div>
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 900, color: "var(--accent)" }}></span>
        </div>
        <nav className="nav-links" style={{ gap: "2.5rem" }}>
          <Link href="/catalogo" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }} className="hover-glow-text">CATALAGO</Link>
          <Link href="/modelos-parametricos" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 500, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }} className="hover-glow-text">PERSONALIZAVEIS</Link>
          <Link href="/leiloes" style={{ color: "var(--neon-purple)", textDecoration: "none", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }} className="hover-glow-text">LEILÃO</Link>
          <Link href="/contato" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 500, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }} className="hover-glow-text">CONTATO</Link>

          <Link href="/carrinho" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)", textDecoration: "none" }} className="hover-glow-text">
            <ShoppingCart size={16} color="var(--accent)" /> <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>CARRINHO</span>
          </Link>

          <Link href="/cliente/login" className="cyber-button" style={{ padding: "0.6rem 2rem", fontSize: "0.8rem", borderRadius: "4px", fontWeight: 900 }}>
            LOGIN
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      {/* Hero Section Extremo */}
      <section className="hero-flex" style={{ minHeight: "90vh", padding: "0 6rem" }}>
        <div style={{ position: "absolute", top: "10%", right: "10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(0, 242, 255, 0.1) 0%, transparent 70%)", filter: "blur(100px)", zIndex: 0, pointerEvents: "none" }} />

        <div className="hero-text-container" style={{ position: "relative", zIndex: 10 }}>
          <GSAPScrollReveal direction="left" distance={100}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "1rem", padding: "0.5rem 1.5rem", borderRadius: "4px", background: "rgba(0, 242, 255, 0.05)", borderLeft: "4px solid var(--accent)", color: "var(--accent)", fontWeight: 900, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "3rem" }}>
              <Activity size={16} /> Protocolo de Produção Ativo
            </div>

            <h2 style={{ fontSize: "6.5rem", lineHeight: "1", fontWeight: 900, marginBottom: "2rem", letterSpacing: "-3px", textTransform: "uppercase", fontStyle: "italic", paddingRight: "1rem" }}>
              <span style={{ color: "white" }}>Cyber</span><br />
              <span className="gradient-text" style={{ backgroundImage: "linear-gradient(90deg, var(--accent), var(--neon-purple))", paddingRight: "0.5rem", display: "inline-block" }}>BRCPRINT</span>
            </h2>

            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.2rem", marginBottom: "4rem", maxWidth: "550px", lineHeight: "1.6", borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              Inicie o protocolo de fabricação aditiva em segundos. <br />
              <span style={{ color: "var(--accent)" }}>Fonte digital. Saída física. Controle total.</span>
            </p>

            <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
              <Link href="/cliente/novo" className="cyber-button" style={{ padding: "1.5rem 4rem", fontSize: "1rem", borderRadius: "2px", fontWeight: 900 }}>
                INICIAR PROJETO
              </Link>
              <Link href="#como-funciona" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.8rem" }} className="hover-glow-text">
                Entenda Mais <Play size={14} fill="currentColor" />
              </Link>
            </div>

            <div style={{ display: "flex", gap: "4rem", marginTop: "6rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>02.5s</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px" }}>Ping</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--neon-purple)", lineHeight: 1 }}>GARANTIA</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px" }}>Pagamento Seguro</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--neon-green)", lineHeight: 1 }}>AUTO</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px" }}>Automatização</span>
              </div>
            </div>
          </GSAPScrollReveal>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5 }}>
          <GSAPScrollReveal direction="right" distance={100} delay={0.3}>
            <div style={{ position: "relative" }}>
              {/* Overlay HUD elements around 3D scene */}
              <div style={{ position: "absolute", top: -40, left: -40, border: "2px solid var(--accent)", width: 100, height: 100, borderRight: 0, borderBottom: 0, zIndex: 10 }}></div>
              <div style={{ position: "absolute", bottom: -40, right: -40, border: "2px solid var(--neon-purple)", width: 100, height: 100, borderLeft: 0, borderTop: 0, zIndex: 10 }}></div>
              <div style={{ position: "absolute", top: "50%", right: -60, transform: "translateY(-50%)", writingMode: "vertical-rl", fontSize: "0.6rem", color: "var(--accent)", letterSpacing: "4px", fontWeight: 900, textTransform: "uppercase" }}>Varredura do buffer ativo</div>

              <div style={{ width: "550px", height: "550px" }}>
                <Hero3DScene />
              </div>
            </div>
          </GSAPScrollReveal>
        </div>
      </section>



      {/* Seção Como Funciona Futurista */}
      <section id="como-funciona" className="section-padding" style={{ padding: "10rem 4rem", position: "relative", zIndex: 10 }}>
        <GSAPScrollReveal direction="up" stagger={0.2}>
          <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "2rem", marginBottom: "6rem" }}>
              <h2 style={{ fontSize: "5rem", fontWeight: 900, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-3px" }}>
                FLUXO DO<br /><span style={{ color: "var(--accent)" }}>SISTEMA</span>
              </h2>
              <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg, var(--accent), transparent)", marginBottom: "1rem" }}></div>
            </div>

            <div className="steps-container" style={{ gap: "4rem" }}>
              {/* Step 1 */}
              <div className="step-card glass-panel hover-glow" style={{ border: "1px solid var(--border)", padding: "4rem", borderRadius: "4px", background: "rgba(10, 12, 18, 0.6)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--accent)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "1rem" }}>Passo 1</div>
                  <h3 style={{ fontSize: "2.5rem", marginBottom: "1.5rem", fontWeight: 900, textTransform: "uppercase" }}>UPLOAD DOS ARQUIVOS</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "2rem" }}>
                    Nossos algoritmos realizam uma varredura completa na geometria do seu arquivo 3D em milissegundos.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ padding: "1rem", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--accent)" }}>[ STL / OBJ / 3MF ]</div>
                    <div style={{ padding: "1rem", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--neon-green)" }}>FATIAMENTO EM TEMPO REAL</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "100%", height: 350, border: "1px solid var(--border)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: "var(--accent)", boxShadow: "0 0 20px var(--accent)", animation: "scanning 4s ease-in-out infinite" }}></div>
                    <Cpu size={120} strokeWidth={0.5} color="var(--accent)" style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: "4rem", position: "absolute" }}>📁</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step-card-reverse glass-panel hover-glow" style={{ border: "1px solid var(--border)", padding: "4rem", borderRadius: "4px", background: "rgba(10, 12, 18, 0.6)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--neon-purple)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "1rem" }}>Passo 2</div>
                  <h3 style={{ fontSize: "2.5rem", marginBottom: "1.5rem", fontWeight: 900, textTransform: "uppercase" }}>Pagamento por PIX</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "2rem" }}>
                    Transação via Pix com reconhecimento de rede instantâneo. Sem espera, sem erros de processamento.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ padding: "1rem", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--neon-purple)" }}>VALIDAÇÃO INSTANTÂNEA</div>
                    <div style={{ padding: "1rem", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--neon-green)" }}>MERCADO PAGO</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "100%", height: 350, border: "1px solid var(--border)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                    <Shield size={120} strokeWidth={0.5} color="var(--neon-purple)" style={{ opacity: 0.3 }} />
                    <span style={{ color: "var(--neon-purple)", fontSize: "5rem" }}>QR</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step-card glass-panel hover-glow" style={{ border: "1px solid var(--border)", padding: "4rem", borderRadius: "4px", background: "rgba(10, 12, 18, 0.6)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--neon-green)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "1rem" }}>Passo 3</div>
                  <h3 style={{ fontSize: "2.5rem", marginBottom: "1.5rem", fontWeight: 900, textTransform: "uppercase" }}>DIRETO PARA A MÁQUINA</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "2rem" }}>
                    Sem baixar e passar arquivo para pen-drive ou SD. O sistema conecta na sua rede via IoT e aciona a máquina correta para começar a produção.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                      {["Controle de Fila Inteligente", "Métricas em Tempo Real"].map((item, i) => (
                        <div key={i} style={{ padding: "1rem", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--neon-green)", flex: i === 2 ? "1 1 100%" : "1 1 calc(50% - 0.5rem)" }}>
                          ✓ {item.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "100%", height: 350, border: "1px solid var(--border)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                    <Zap size={120} strokeWidth={0.5} color="var(--neon-green)" style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--neon-green)", letterSpacing: "2px", position: "absolute", bottom: "10%", right: "10%", opacity: 0.5 }}>IoT ATIVADO</span>
                    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "40px" }}>
                      {[40, 70, 30, 90, 50, 80, 40].map((h, i) => (
                        <div key={i} style={{ width: "4px", height: `${h}%`, background: "var(--neon-green)", opacity: 0.6 }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GSAPScrollReveal>
      </section>

      {/* B2B Node Futurista */}
      <section id="b2b-manufatura" style={{ padding: "10rem 4rem", position: "relative", borderTop: "1px solid var(--border)", background: "rgba(0, 242, 255, 0.02)" }}>
        <GSAPScrollReveal direction="left">
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--neon-green)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "2rem" }}>Acesso Nível Industrial</div>
              <h2 style={{ fontSize: "4rem", fontWeight: 900, marginBottom: "2rem", textTransform: "uppercase", lineHeight: 1 }}>
                PRODUÇÃO<br /><span style={{ color: "var(--neon-green)" }}>INTELIGENTE</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", lineHeight: 1.8, marginBottom: "3rem" }}>
                Conecte sua empresa ao cluster de manufatura digital mais avançado do país. Peças técnicas, brindes e produção sob demanda.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {["Engenharia Avançada", "Materiais Técnicos", "Escalabilidade Imediata"].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ width: 10, height: 10, background: "var(--neon-green)", borderRadius: "2px" }}></div>
                    <span style={{ fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/contato" className="cyber-button" style={{ marginTop: "4rem", display: "inline-block", padding: "1.5rem 3rem", borderRadius: "2px", fontWeight: 900, "--accent": "var(--neon-green)" } as any}>
                FALAR COM CONSULTOR
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -20, border: "1px solid var(--neon-green)", opacity: 0.2, zIndex: 0 }}></div>
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" style={{ width: "100%", height: "500px", objectFit: "cover", borderRadius: "2px", opacity: 0.8 }} />
              <div style={{ position: "absolute", bottom: 20, right: 20, background: "rgba(0,0,0,0.8)", padding: "1rem 2rem", border: "1px solid var(--neon-green)", fontSize: "0.8rem", fontWeight: 900, color: "var(--neon-green)" }}>
                MODO DE PRODUÇÃO ATIVO
              </div>
            </div>
          </div>
        </GSAPScrollReveal>
      </section>

      {/* Core Capabilities Node Grid */}
      <section id="beneficios" style={{ padding: "10rem 4rem", position: "relative", borderTop: "1px solid var(--border)" }}>
        <GSAPScrollReveal direction="up" stagger={0.2}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "8rem" }}>
              <div style={{ color: "var(--accent)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "8px", marginBottom: "2rem", fontSize: "0.7rem" }}>Integração total</div>
              <h2 style={{ fontSize: "5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-4px" }}>Vantagens<br /><span style={{ color: "var(--accent)" }}>Do Sistema</span></h2>
            </div>

            <div className="benefits-grid" style={{ gap: "2rem" }}>
              {[
                { icon: "🌙", title: "DISPONIBILIDADE 24/7", desc: "Protocolo de recebimento de arquivos ativo ininterruptamente. Orçamentos em tempo real sem interação humana." },
                { icon: "🎯", title: "CUSTO DE PRECISÃO", desc: "Algoritmos avançados calculam energia, depreciação e material com precisão de 4 casas decimais." },
                { icon: "💬", title: "AVISOA AUTOMÁTICOS", desc: "IA integrada que notifica cada etapa do processo produtivo diretamente via terminal mobile." },
                { icon: "🎁", title: "SISTEMA DE CASHBACK", desc: "Cada grama impressa gera créditos automáticos no seu buffer financeiro para futuras operações." }
              ].map((b, i) => (
                <div key={i} className="card glass-panel hover-glow" style={{ padding: "4rem 2rem", background: "rgba(10, 12, 18, 0.4)", borderRadius: "2px", border: "1px solid var(--border)", borderTop: `4px solid ${i % 2 === 0 ? "var(--accent)" : "var(--neon-purple)"}` }}>
                  <div style={{ fontSize: "3rem", marginBottom: "2rem" }}>{b.icon}</div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "1.5rem", textTransform: "uppercase" }}>{b.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "1rem" }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </GSAPScrollReveal>
      </section>


      {/* CTA Final */}
      <section className="section-padding" style={{ padding: "8rem 2rem", background: "linear-gradient(180deg, var(--background) 0%, rgba(108, 99, 255, 0.05) 100%)", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>

          {/* Efeitos de Luz no Background */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%", background: "radial-gradient(ellipse at center, rgba(108, 99, 255, 0.15) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none", zIndex: -1 }} />

          <div className="glass-panel hover-glow animate-fade-in-up" style={{ padding: "5rem 3rem", borderRadius: "32px", border: "1px solid rgba(108, 99, 255, 0.3)", background: "linear-gradient(135deg, rgba(20, 20, 25, 0.8) 0%, rgba(30, 30, 40, 0.9) 100%)", textAlign: "center", position: "relative", overflow: "hidden" }}>

            {/* Elemento Decorativo no Card */}
            <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "150px", height: "150px", background: "radial-gradient(circle, rgba(234, 179, 8, 0.2) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1.2rem", borderRadius: "999px", background: "rgba(108, 99, 255, 0.15)", color: "#a5b4fc", fontWeight: 800, fontSize: "0.9rem", marginBottom: "1.5rem", border: "1px solid rgba(108, 99, 255, 0.3)", textTransform: "uppercase", letterSpacing: "1px" }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 10px #818cf8" }}></span>
              Junte-se ao Futuro da Manufatura
            </div>

            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, marginBottom: "1.5rem", lineHeight: 1.1, color: "#fff" }}>
              Vamos <span className="gradient-text">acelerar</span> o seu negócio?
            </h2>

            <p style={{ fontSize: "1.2rem", color: "var(--muted)", marginBottom: "3.5rem", maxWidth: "600px", margin: "0 auto 3.5rem" }}>
              Deixe as planilhas e o orçamento manual no passado. Automatize seus pedidos, gerencie sua demanda logística e lucre muito mais com a brcprint.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem" }}>
              <Link href="/cliente/login" className="btn btn-primary pulse-glow shadow-glow" style={{ padding: "1.2rem 3rem", fontSize: "1.1rem", borderRadius: "16px", fontWeight: 800, flex: "0 1 auto", background: "linear-gradient(135deg, var(--accent), #4f46e5)" }}>
                Criar Minha Conta Grátis
              </Link>
              <Link href="/catalogo" className="btn btn-ghost" style={{ padding: "1.2rem 3rem", fontSize: "1.1rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 600, flex: "0 1 auto", color: "#fff", background: "rgba(255,255,255,0.05)" }}>
                Explorar Catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* XP Protocol & Gamification */}
      <section id="fidelidade" style={{ padding: "10rem 4rem", background: "rgba(251, 191, 36, 0.03)", position: "relative", borderTop: "1px solid var(--border)" }}>
        <GSAPScrollReveal direction="up" stagger={0.2}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "8rem" }}>
              <div style={{ color: "var(--neon-green)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "8px", marginBottom: "2rem", fontSize: "0.7rem" }}>Subsistema de Fidelidade Ativo</div>
              <h2 style={{ fontSize: "5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-4px" }}>XP<br /><span style={{ color: "#fbbf24" }}>Protocolo</span></h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {[
                { icon: "🛒", title: "IMPRIMIR PARA EVOLUIR", desc: "Cada grama de filamento processada incrementa seu nível. R$1.00 = 1XP. Desbloqueie multiplicadores de cashback permanentes." },
                { icon: "🤝", title: "PLANO AFILIADO", desc: "Link de referência único. Sink de lucros vitalício de 5% sobre o fluxo produtivo de todos os seus indicados." },
                { icon: "⭐", title: "NÍVEL DIAMANTE", desc: "Alcance o rank supremo de patente industrial e obtenha prioridade absoluta em filas de impressão e suporte técnico." }
              ].map((item, i) => (
                <div key={i} className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", border: "1px solid var(--border)", background: "rgba(0,0,0,0.6)", borderRadius: "4px" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "2rem" }}>{item.icon}</div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "1.5rem", textTransform: "uppercase" }}>{item.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "1rem" }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "6rem" }}>
              <Link href="/cliente/login" className="cyber-button" style={{ padding: "1.5rem 4rem", borderRadius: "2px", fontWeight: 900, "--accent": "#fbbf24" } as any}>
                INICIAR FILIAÇÃO
              </Link>
            </div>
          </div>
        </GSAPScrollReveal>
      </section>

      {/* UGC_INTEL & Proof of Quality */}
      {reviews.length > 0 && (
        <section id="avaliacoes" style={{ padding: "10rem 4rem", position: "relative", borderTop: "1px solid var(--border)" }}>
          <GSAPScrollReveal direction="up" stagger={0.1}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "6rem" }}>
                <div style={{ color: "var(--accent)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "8px", marginBottom: "2rem", fontSize: "0.7rem" }}>Public_Interface_Feed</div>
                <h2 style={{ fontSize: "4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px" }}>UGC_<span style={{ color: "var(--accent)" }}>Intel</span></h2>
              </div>

              <div className="benefits-grid" style={{ gap: "2rem" }}>
                {reviews.map((r, index) => (
                  <div key={r.id} className="glass-panel" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", borderRadius: "2px", border: "1px solid var(--border)", background: "rgba(10, 12, 18, 0.6)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 900, fontSize: "1rem", color: "var(--accent)", letterSpacing: "1px" }}>{r.client_name.toUpperCase()}</div>
                      <div style={{ color: "#fbbf24", fontSize: "1rem" }}>
                        {"★".repeat(r.rating)}
                      </div>
                    </div>
                    {r.photo_url && (
                      <div style={{ width: "100%", height: "250px", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                        <img src={r.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                      </div>
                    )}
                    <p style={{ fontStyle: "italic", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.6 }}>"{r.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          </GSAPScrollReveal>
        </section>
      )}


      {/* Parametric_Models_v3 Terminal */}
      {parametricModels.length > 0 && (
        <section id="customizaveis" style={{ padding: "10rem 4rem", position: "relative", borderTop: "1px solid var(--border)" }}>
          <GSAPScrollReveal direction="up" stagger={0.2}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "8rem" }}>
                <div style={{ color: "var(--accent)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "8px", marginBottom: "2rem", fontSize: "0.7rem" }}>Base de Dados Paramétrica</div>
                <h2 style={{ fontSize: "5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-4px" }}>Modelos<br /><span style={{ color: "var(--accent)" }}>Paramétricos</span></h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "3rem" }}>
                {parametricModels.map((model) => (
                  <div key={model.id} className="glass-panel" style={{ border: "1px solid var(--border)", background: "rgba(0,0,0,0.6)", borderRadius: "4px" }}>
                    <div style={{ position: "relative", height: "250px", overflow: "hidden", borderBottom: "1px solid var(--border)" }}>
                      <img src={model.image_url || "/placeholder.png"} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                      <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(0, 242, 255, 0.2)", padding: "0.5rem 1rem", border: "1px solid var(--accent)", color: "var(--accent)", fontWeight: 900, fontSize: "0.7rem" }}>PARAMETRIC_V3</div>
                    </div>
                    <div style={{ padding: "3rem" }}>
                      <h3 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "1rem", textTransform: "uppercase" }}>{model.title}</h3>
                      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.6, marginBottom: "3rem" }}>{model.description}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", display: "block", letterSpacing: "2px" }}>PREÇO BASE</span>
                          <span style={{ fontSize: "1.5rem", fontWeight: 900 }}>R$ {Number(model.base_price).toFixed(2)}</span>
                        </div>
                        <Link href={`/modelos-parametricos/${model.id}`} className="cyber-button" style={{ padding: "1rem 2rem", fontSize: "0.8rem", "--accent": "var(--accent)" } as any}>
                          CONFIGURAR
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GSAPScrollReveal>
        </section>
      )}

      {/* Seção Leilões Intense Terminal */}
      {activeAuctions.length > 0 && (
        <section id="leiloes" style={{ padding: "10rem 4rem", background: "rgba(188, 19, 254, 0.03)", position: "relative", borderTop: "1px solid var(--border)" }}>
          <GSAPScrollReveal direction="up" stagger={0.3}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "8rem" }}>
                <div style={{ color: "var(--neon-purple)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "8px", marginBottom: "2rem", fontSize: "0.7rem" }}>Terminal_Auction_Online</div>
                <h2 style={{ fontSize: "5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-4px" }}>Penny<br /><span style={{ color: "var(--neon-purple)" }}>Auction_v2</span></h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "3rem" }}>
                {activeAuctions.map((auc) => (
                  <div key={auc.id} className="glass-panel" style={{ border: "1px solid var(--border)", position: "relative", background: "rgba(0,0,0,0.6)", borderRadius: "4px" }}>
                    <div style={{ position: "relative", height: "300px" }}>
                      <img src={auc.image_url || "/placeholder.png"} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
                      <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(188, 19, 254, 0.2)", padding: "0.5rem 1rem", border: "1px solid var(--neon-purple)", color: "var(--neon-purple)", fontWeight: 900, fontSize: "0.7rem" }}>LIVE_BIDDING</div>
                    </div>
                    <div style={{ padding: "3rem", textAlign: "left" }}>
                      <h3 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "1rem", textTransform: "uppercase" }}>{auc.title}</h3>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "2rem", border: "1px solid var(--border)", marginBottom: "2rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "2px" }}>Current_Price</span>
                        <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--neon-purple)" }}>R$ {Number(auc.current_price).toFixed(2)}</div>
                      </div>
                      <Link href={`/leiloes/${auc.id}`} className="cyber-button" style={{ width: "100%", display: "block", textAlign: "center", padding: "1.5rem", fontWeight: 900, "--accent": "var(--neon-purple)" } as any}>
                        EXEC_BID
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GSAPScrollReveal>
        </section>
      )}

      {/* Auction Protocol v2 */}
      <section id="como-funciona-leilao" style={{ padding: "10rem 4rem", position: "relative", borderTop: "1px solid var(--border)" }}>
        <GSAPScrollReveal direction="up" stagger={0.2}>
          <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "2rem", marginBottom: "6rem" }}>
              <h2 style={{ fontSize: "5rem", fontWeight: 900, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-3px" }}>
                Participe<br /><span style={{ color: "var(--neon-purple)" }}>do Leilão</span>
              </h2>
              <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg, var(--neon-purple), transparent)", marginBottom: "1rem" }}></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {[
                { step: "01", title: "COMPRAR CRÉDITOS", desc: "Adquira pacotes de lances para sua wallet. Cada lance é uma autorização de entrada na disputa." },
                { step: "02", title: "ENVIAR LANCE", desc: "Cada lance incrementa o preço em centavos e adiciona tempo extra ao buffer de fechamento." },
                { step: "03", title: "ÚLTIMO LANCE", desc: "Seja o último nó a enviar um lance antes do timeout e arremate o asset pelo valor final." }
              ].map((item, i) => (
                <div key={i} className="glass-panel" style={{ padding: "4rem 2rem", background: "rgba(10, 12, 18, 0.4)", borderRadius: "2px", border: "1px solid var(--border)", borderTop: "4px solid var(--neon-purple)" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--neon-purple)", letterSpacing: "4px", marginBottom: "2rem" }}>PHASE_{item.step}</div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "1.5rem", textTransform: "uppercase" }}>{item.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "1rem" }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "6rem" }}>
              <Link href="/leiloes" className="cyber-button" style={{ padding: "1.5rem 4rem", "--accent": "var(--neon-purple)" } as any}>
                VER LEILÕES
              </Link>
            </div>
          </div>
        </GSAPScrollReveal>
      </section>


      {/* Seção Patrocinamos (Sponsorships) */}
      <section id="patrocinios" className="section-padding" style={{ padding: "4rem 2rem", background: "var(--background)", borderTop: "1px solid var(--border)", position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700, marginBottom: "2rem" }}>
            Temos orgulho em patrocinar e apoiar:
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "3rem", opacity: 0.8 }}>
            <SponsorshipLogos />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "3rem 2rem", textAlign: "center", borderTop: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.9rem", background: "black" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/brcprint.svg" alt="BRCPrint Logo" style={{ height: "30px", filter: "grayscale(100%) opacity(0.5)" }} />
          </div>
          <div>© {new Date().getFullYear()} brcprint. Plataforma IoT de Automação para Print Farms.</div>
        </div>
      </footer>

      {/* Floating Public Chat Assistant */}
      <AiChatWidget mode="public" />
    </div>
  );
}
