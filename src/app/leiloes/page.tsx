import Link from "next/link";
import pool from "@/lib/db";
import { Gavel, Clock, ArrowRight } from "lucide-react";
import AiChatWidget from "@/components/AiChatWidget";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuctionListClient from "@/components/AuctionListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeiloesPage() {
  const session = await getServerSession(authOptions);
  const isLogged = !!session;

  let auctions: any[] = [];
  try {
    const [rows]: any = await pool.query(`
      SELECT a.id, a.title, a.description, a.image_url, a.retail_value, a.current_price, a.end_time, a.time_increment, c.name as winner_name
      FROM auction_items a
      LEFT JOIN clients c ON a.winner_id = c.id
      WHERE a.status = 'active'
      ORDER BY a.end_time ASC
    `);
    console.log("LEILOES DB RAW RESULTS:", rows);
    auctions = rows;
  } catch (err) {
    console.error("Erro ao puxar leilões", err);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Header Público */}
      {!isLogged && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 2rem",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            background: "rgba(10, 10, 10, 0.8)",
            backdropFilter: "blur(12px)",
            zIndex: 100
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/brcprint.svg" alt="BRCPrint" style={{ height: "30px", objectFit: "contain" }} />
          </Link>
          <nav className="nav-links">
            <Link href="/leiloes/comprar-lances" className="btn btn-ghost" style={{ padding: "0.5rem 1rem", borderRadius: "6px", color: "#facc15", fontWeight: 700, border: "1px solid rgba(234, 179, 8, 0.4)" }}>
              🪙 Comprar Lances
            </Link>
            <Link href="/cliente/login" className="btn btn-primary" style={{ padding: "0.5rem 1rem", borderRadius: "6px" }}>
              Acessar Minha Conta
            </Link>
          </nav>
        </header>
      )}

      <main style={{ flex: 1, padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1.2rem", borderRadius: "999px", background: "rgba(234, 179, 8, 0.15)", color: "#facc15", fontWeight: 800, fontSize: "0.9rem", marginBottom: "1rem", border: "1px solid rgba(234, 179, 8, 0.4)" }}>
            <Gavel size={16} /> Leilão de Centavos
          </div>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 900, marginBottom: "1rem" }}>Prêmios Premium.<br />Preços Absurdos.</h1>
          <p style={{ color: "var(--muted)", maxWidth: 600, margin: "0 auto", fontSize: "1.1rem", marginBottom: "2rem" }}>
            Use seus lances comprados para cobrir ofertas e levar peças incríveis (e impressoras 3D!) gastando a partir de 1 centavo.
          </p>
          <Link href="/leiloes/comprar-lances" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "1rem 2rem", fontSize: "1.1rem", borderRadius: "999px", background: "linear-gradient(90deg, #eab308, #ca8a04)", fontWeight: 800 }}>
            📦 Recarregar minha Carteira de Lances
          </Link>
        </div>

        {auctions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <Clock size={48} color="var(--muted)" style={{ margin: "0 auto 1.5rem" }} />
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Nenhum leilão ao vivo.</h3>
            <p style={{ color: "var(--muted)" }}>Fique de olho! Novos prêmios são cadastrados diariamente.</p>
          </div>
        ) : (
          <AuctionListClient initialAuctions={auctions} />
        )}
      </main>

      <AiChatWidget mode="public" />
    </div>
  );
}
