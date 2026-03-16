"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FileText, Printer, Box, Settings, BarChart2, CheckSquare, MessageCircle, Star, Image as ImageIcon, Users, Link as LinkIcon, Menu, X, DollarSign } from 'lucide-react';

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊", roles: ["admin", "vendedor"] },
  { href: "/admin/fabrica", label: "Fábrica", icon: "🏭", roles: ["admin", "operador"] },
  { href: "/admin/scheduling", label: "Motor de Fila", icon: "🕒", roles: ["admin", "operador"] },
  { href: "/impressoras", label: "Painel de Máquinas", icon: "🖨️", roles: ["admin", "operador"] },
  { href: "/cotacoes", label: "Cotações", icon: "📄", roles: ["admin", "vendedor"] },
  { href: "/admin/projetos", label: "Projetos & Kits", icon: "📦", roles: ["admin", "vendedor"] },
  { href: "/admin/cupons", label: "Promoções e Cupons", icon: "🎟️", roles: ["admin", "vendedor"] },
  { href: "/admin/upsells", label: "Upsells (Serviços)", icon: "🎁", roles: ["admin", "vendedor"] },
  { href: "/admin/avaliacoes", label: "Avaliações (UGC)", icon: "⭐", roles: ["admin", "vendedor"] },
  { href: "/admin/catalogo", label: "Catálogo 3D", icon: "🖼️", roles: ["admin", "vendedor"] },
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
  { href: "/cliente/perfil", label: "Meu Perfil", icon: "👤" },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname() || "";
  const [clientData, setClientData] = (require("react").useState)(null);
  const isClientArea = pathname === "/cliente" || pathname.startsWith("/cliente/");

  const userRole = (session?.user as any)?.role || "operador";

  require("react").useEffect(() => {
    if (isClientArea && session?.user) {
      fetch("/api/clients/me")
        .then(r => r.ok && r.json())
        .then(d => d && setClientData(d))
        .catch(() => { });
    }
  }, [isClientArea, session]);

  const links = isClientArea
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
          {/* <div>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text)" }}>brcprint</div>
            <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: 1 }}>Precificação 3D</div>
          </div> */}
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

        {isClientArea && clientData && (
          <div style={{
            marginTop: "1.5rem",
            padding: "0.75rem 0.85rem",
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            borderRadius: 10,
            border: "1px solid #86efac",
            margin: "1rem 0.5rem 0"
          }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.15rem" }}>
                🪙 Saldo Atual
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#14532d" }}>
                {Number((clientData as any).credit_balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #86efac", paddingTop: "0.5rem" }}>
              <div style={{ fontSize: "0.6rem", color: "#166534", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.15rem" }}>
                Total Acumulado
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#15803d" }}>
                {Number((clientData as any).total_cashback_earned || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
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
