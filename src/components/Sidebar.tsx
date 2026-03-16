"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FileText, Printer, Box, Settings, BarChart2, CheckSquare, MessageCircle, Star, Image as ImageIcon, Users, Link as LinkIcon, Menu, X, DollarSign, ShoppingCart } from 'lucide-react';

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊", roles: ["admin", "vendedor"] },
  { href: "/admin/contatos", label: "Caixa de Entrada", icon: "📬", roles: ["admin", "vendedor", "operador"] },
  { href: "/admin/fabrica", label: "Fábrica", icon: "🏭", roles: ["admin", "operador"] },
  { href: "/admin/scheduling", label: "Fila de Impressão", icon: "🕒", roles: ["admin", "operador"] },
  { href: "/impressoras", label: "Painel de Máquinas", icon: "🖨️", roles: ["admin", "operador"] },
  { href: "/cotacoes", label: "Cotações", icon: "📄", roles: ["admin", "vendedor"] },
  { href: "/admin/orders", label: "Pedidos do Carrinho", icon: ShoppingCart, roles: ["admin", "vendedor", "operador"] },
  { href: "/admin/projetos", label: "Projetos & Kits", icon: "📦", roles: ["admin", "vendedor"] },
  { href: "/admin/cupons", label: "Promoções e Cupons", icon: "🎟️", roles: ["admin", "vendedor"] },
  { href: "/admin/upsells", label: "Upsells (Serviços)", icon: "🎁", roles: ["admin", "vendedor"] },
  { href: "/admin/avaliacoes", label: "Avaliações (UGC)", icon: "⭐", roles: ["admin", "vendedor"] },
  { href: "/admin/catalogo", label: "Catálogo 3D", icon: "🖼️", roles: ["admin", "vendedor"] },
  { href: "/admin/modelos-parametricos", label: "Customizáveis", icon: "🧩", roles: ["admin", "vendedor"] },
  { href: "/admin/leiloes", label: "Leilões", icon: "🔨", roles: ["admin"] },
  { href: "/admin/pacotes-lances", label: "Loja de Lances", icon: "🪙", roles: ["admin"] },
  { href: "/filamentos", label: "Filamentos", icon: "🧵", roles: ["admin", "operador"] },
  { href: "/admin/estoque", label: "Estoque de Materiais", icon: "📦", roles: ["admin", "operador"] },
  { href: "/admin/traceability", label: "Rastreabilidade", icon: "🔍", roles: ["admin", "vendedor"] },
  { href: "/clientes", label: "Clientes", icon: "👤", roles: ["admin", "vendedor"] },
  { href: "/admin/afiliados", label: "Parceiros & Afiliados", icon: "🤝", roles: ["admin", "vendedor"] },
  { href: "/admin/afiliados/saques", label: "Comissões (Saques)", icon: "💸", roles: ["admin", "vendedor"] },
  { href: "/admin/usuarios", label: "Gerenciar Admins", icon: "👥", roles: ["admin"] },
  { href: "/admin/planos", label: "Planos (B2B)", icon: "🔁", roles: ["admin"] },
  { href: "/admin/metricas", label: "Métricas e BI", icon: BarChart2, roles: ["admin"] },
  { href: "/admin/financial", label: "Painel Financeiro (DRE)", icon: "📊", roles: ["admin"] },
  { href: "/admin/despesas", label: "Contas a Pagar", icon: DollarSign, roles: ["admin"] },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️", roles: ["admin"] },
];

const clientLinks = [
  { href: "/cliente", label: "Meus Pedidos", icon: "📦" },
  { href: "/cliente/novo", label: "Nova Solicitação", icon: "➕" },
  { href: "/modelos-parametricos", label: "Customizáveis", icon: "🧩" },
  { href: "/leiloes/comprar-lances", label: "Comprar Lances", icon: "🪙" },
  { href: "/cliente/meus-lances", label: "Histórico de Lances", icon: "🔨" },
  { href: "/cliente/afiliado", label: "Programa de Afiliados", icon: "🤝" },
  { href: "/cliente/perfil", label: "Meu Perfil", icon: "👤" },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname() || "";
  const [clientData, setClientData] = (require("react").useState)(null);
  const [availablePlans, setAvailablePlans] = (require("react").useState)([]);
  const [gamification, setGamification] = (require("react").useState)(null);

  // Incluindo rotas onde o cliente passa a maior parte do tempo comprando/leiloando, para que métricas carreguem
  const isClientArea = pathname === "/cliente" || pathname.startsWith("/cliente/") || pathname.startsWith("/modelos-parametricos") || pathname.startsWith("/catalogo") || pathname.startsWith("/leiloes") || pathname.startsWith("/leilao");

  const userRole = (session?.user as any)?.role || "operador";

  require("react").useEffect(() => {
    if (isClientArea && session?.user) {
      // 1. Fetch dados básicos do cliente
      fetch("/api/clients/me")
        .then(r => {
          if (r.status === 401) {
            signOut({ callbackUrl: isClientArea ? "/cliente/login" : "/login" });
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .then(d => {
          if (d) {
            setClientData(d);
            // Se não for assinante ativo, busca planos para ofertar
            if (d.subscription_status !== 'active') {
              fetch("/api/subscription-plans")
                .then(pr => pr.ok && pr.json())
                .then(pd => setAvailablePlans(Array.isArray(pd) ? pd.filter((p: any) => p.active) : []))
                .catch(() => { });
            }
          }
        })
        .catch(() => { });

      // 2. Fetch dados de gamificação/badge
      fetch("/api/cliente/gamification")
        .then(r => r.ok && r.json())
        .then(data => {
          if (data && data.tier) setGamification(data);
        })
        .catch(() => { });
    }
  }, [isClientArea, session]);

  const links = (isClientArea || userRole === "cliente")
    ? clientLinks
    : adminLinks.filter(link => !link.roles || link.roles.includes(userRole));

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem 1.25rem 1.25rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/brcprint.svg" alt="brcprint" style={{ height: "32px", width: "auto" }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem" }}>
        {links.map((l) => {
          const active = l.href === "/admin" || l.href === "/cliente" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.6rem 0.85rem",
                borderRadius: 8,
                marginBottom: 2,
                fontSize: "0.875rem",
                fontWeight: active ? 700 : 500,
                color: active ? "var(--text)" : "var(--muted)",
                background: active ? "var(--surface2)" : "transparent",
                textDecoration: "none",
                transition: "all 0.15s",
                borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: "1rem", display: "flex", alignItems: "center" }}>
                {typeof l.icon === "string" ? l.icon : <l.icon size={18} />}
              </span>
              {l.label}
            </Link>
          );
        })}

        {/* Gamification Badge (NEW) */}
        {isClientArea && gamification && (
          <div style={{
            marginTop: "1.5rem",
            padding: "0.85rem",
            background: "var(--background)",
            borderRadius: 10,
            border: `1px solid ${(gamification as any).tier.color}40`,
            margin: "1rem 0.5rem 0",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: `linear-gradient(90deg, ${(gamification as any).tier.color}, transparent)` }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Star size={14} fill={(gamification as any).tier.color} color={(gamification as any).tier.color} />
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: (gamification as any).tier.color, textTransform: "uppercase" }}>
                  {(gamification as any).tier.name}
                </span>
              </div>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--muted)" }}>Lvl. {(gamification as any).total_xp}</span>
            </div>

            {/* Progress Bar */}
            {(gamification as any).next_tier ? (
              <div style={{ width: "100%", height: "4px", background: "var(--surface2)", borderRadius: "2px", overflow: "hidden", marginTop: "2px" }}>
                <div style={{ height: "100%", width: `${(gamification as any).progress_percent}%`, background: (gamification as any).tier.color, transition: "width 1s ease-in-out" }} />
              </div>
            ) : (
              <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 600 }}>Nível Máximo Alcançado!</div>
            )}
          </div>
        )}

        {isClientArea && clientData && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem 0.85rem",
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            borderRadius: 10,
            border: "1px solid #86efac",
            margin: "1rem 0.5rem 0"
          }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.15rem" }}>
                🪙 Cacheback Atual
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#14532d" }}>
                {Number((clientData as any).credit_balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #86efac", paddingTop: "0.5rem" }}>
              <div style={{ fontSize: "0.6rem", color: "#166534", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.15rem" }}>
                Total Resgatado
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#15803d" }}>
                {Number((clientData as any).total_cashback_earned || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>
        )}

        {/* Saldo de Lances de Leilão */}
        {isClientArea && clientData && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem 0.85rem",
            background: "linear-gradient(135deg, #fefce8, #fef08a)",
            borderRadius: 10,
            border: "1px solid #facc15",
            margin: "0.5rem 0.5rem 0"
          }}>
            <div style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.65rem", color: "#854d0e", fontWeight: 700, textTransform: "uppercase" }}>
                🔨 Meus Lances
              </div>
              <Link href="/leiloes/comprar-lances" style={{ fontSize: "0.6rem", background: "#ca8a04", color: "#fff", padding: "0.2rem 0.4rem", borderRadius: "4px", textDecoration: "none", fontWeight: 800 }}>Comprar</Link>
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#713f12", display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
              {Number((clientData as any).bids_balance || 0)} <span style={{ fontSize: "0.7rem", fontWeight: 700, opacity: 0.8 }}>Lances disponíveis</span>
            </div>
          </div>
        )}

        {/* B2B Plans Info */}
        {isClientArea && clientData && (clientData as any).subscription_status === 'active' && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem 0.85rem",
            background: "linear-gradient(135deg, #fefce8, #fef08a)",
            borderRadius: 10,
            border: "1px solid #fde047",
            margin: "1rem 0.5rem 0"
          }}>
            <div style={{ fontSize: "0.65rem", color: "#854d0e", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem", display: "flex", gap: "4px", alignItems: "center" }}>
              <Star size={12} fill="#eab308" color="#eab308" /> Plano {(clientData as any).plan_name}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.6rem", color: "#854d0e" }}>Horas Inclusas</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#713f12" }}>{Number((clientData as any).available_hours_balance || 0)}h</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.6rem", color: "#854d0e" }}>Mat. Incluso</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#713f12" }}>{Number((clientData as any).available_grams_balance || 0)}g</div>
              </div>
            </div>
          </div>
        )}

        {isClientArea && clientData && (clientData as any).subscription_status !== 'active' && availablePlans.length > 0 && (
          <div style={{ margin: "1.5rem 0.5rem 0", padding: "1rem", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, var(--accent), var(--blue))" }} />
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Para Fabricantes</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text)", marginBottom: "0.5rem" }}>Assine um Plano B2B</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.4 }}>
              Garanta franquia de horas de impressão e desconto no quilo de material.
            </div>
            <Link href="/cliente/planos" style={{ display: "block", textAlign: "center", padding: "0.5rem", background: "var(--text)", color: "#023d07ff", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" }}>
              Ver Pacotes
            </Link>
          </div>
        )}
      </nav>

      <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => signOut({ callbackUrl: isClientArea ? "/cliente/login" : "/login" })}
          style={{ width: "100%", padding: "0.5rem", background: "transparent", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}
        >
          Sair do Sistema
        </button>
        <div style={{ fontSize: "0.65rem", color: "var(--muted)", textAlign: "center", marginTop: "0.75rem" }}>
          v1.0 · brcprint © 2026
        </div>
      </div>
    </aside>
  );
}
