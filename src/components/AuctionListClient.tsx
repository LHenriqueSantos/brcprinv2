"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

export default function AuctionListClient({ initialAuctions }: { initialAuctions: any[] }) {
  const [auctions, setAuctions] = useState(initialAuctions);

  useEffect(() => {
    // Poll updates every 2s
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/leiloes/realtime");
        if (res.ok) {
          const freshData = await res.json();
          // Update only prices/times/status
          setAuctions(prev => {
            return prev.map(p => {
              const fresh = freshData.find((f: any) => f.id === p.id);
              if (fresh) {
                return { ...p, current_price: fresh.current_price, end_time: fresh.end_time, status: fresh.status, winner_name: fresh.winner_name };
              }
              return p;
            });
          });
        }
      } catch (err) { }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
      {auctions.map(auc => (
        <AuctionCard key={auc.id} auc={auc} />
      ))}
    </div>
  );
}

function AuctionCard({ auc }: { auc: any }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isEnding, setIsEnding] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().getTime();
      const end = new Date(auc.end_time).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setIsEnding(false);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        setIsEnding(diff <= 15000); // last 15 seconds
      }
    };
    updateTime();
    const int = setInterval(updateTime, 1000);
    return () => clearInterval(int);
  }, [auc.end_time]);

  return (
    <div className="card hover-glow" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--surface)", border: isEnding ? "2px solid #ef4444" : "1px solid var(--border)", transition: "border 0.2s" }}>
      <div style={{ position: "relative", height: "240px", background: "#000" }}>
        <img src={auc.image_url || "/placeholder.png"} alt={auc.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
        <div style={{ position: "absolute", top: "1rem", right: "1rem", background: isEnding ? "#ef4444" : "#facc15", color: isEnding ? "#fff" : "#000", padding: "0.4rem 0.8rem", borderRadius: "999px", fontSize: "0.9rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.4rem", boxShadow: "0 4px 10px rgba(0,0,0,0.5)", zIndex: 10 }}>
          <Clock size={16} className={isEnding ? "pulse" : ""} /> {timeLeft}
        </div>
        {auc.winner_name && (
          <div style={{ position: "absolute", bottom: "1rem", left: "1rem", background: "rgba(0,0,0,0.8)", color: "#fff", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, zIndex: 10 }}>
            👑 Liderando: {auc.winner_name.split(' ')[0]}
          </div>
        )}
      </div>

      <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "var(--text)" }}>{auc.title}</h3>
        <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1.5rem", textDecoration: "line-through" }}>
          Valor Mercado: R$ {Number(auc.retail_value).toFixed(2).replace('.', ',')}
        </div>

        <div style={{ background: "var(--surface2)", borderRadius: "8px", padding: "1rem", textAlign: "center", border: "1px solid var(--border)", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
          {isEnding && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#ef4444" }} className="pulse-bg" />}
          <div style={{ color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>Oferta Atual</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#facc15" }}>
            R$ {Number(auc.current_price).toFixed(2).replace('.', ',')}
          </div>
        </div>

        <div style={{ marginTop: "auto" }}>
          <Link href={`/leiloes/${auc.id}`} className="btn btn-primary" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "1rem", borderRadius: "8px", fontSize: "1.1rem", fontWeight: 800, background: isEnding ? "#ef4444" : "" }}>
            Dar Lance! <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
