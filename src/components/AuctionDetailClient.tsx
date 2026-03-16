"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function AuctionDetailClient({ initialAuction }: { initialAuction: any }) {
  const [auc, setAuc] = useState(initialAuction);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isEnding, setIsEnding] = useState<boolean>(false);

  useEffect(() => {
    // Poll updates every 2s
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/leiloes/realtime");
        if (res.ok) {
          const freshData = await res.json();
          const fresh = freshData.find((f: any) => f.id === auc.id);
          if (fresh) {
            setAuc((prev: any) => ({ ...prev, current_price: fresh.current_price, end_time: fresh.end_time, status: fresh.status, winner_name: fresh.winner_name }));
          }
        }
      } catch (err) { }
    }, 2000);
    return () => clearInterval(interval);
  }, [auc.id]);

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
        setIsEnding(diff <= 15000); // 15 seconds
      }
    };
    updateTime();
    const int = setInterval(updateTime, 1000);
    return () => clearInterval(int);
  }, [auc.end_time]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div style={{ background: "var(--surface)", padding: "2rem", borderRadius: "12px", border: isEnding ? "2px solid #ef4444" : "1px solid var(--accent)", boxShadow: isEnding ? "0 10px 30px rgba(239, 68, 68, 0.1)" : "0 10px 30px rgba(16, 185, 129, 0.05)", transition: "all 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: 0, color: "var(--text)" }}>Status Atual do Lote</h3>
        <div style={{ background: isEnding ? "#ef4444" : "#facc15", color: isEnding ? "#fff" : "#000", padding: "0.4rem 0.8rem", borderRadius: "999px", fontSize: "0.9rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Clock size={16} className={isEnding ? "pulse" : ""} /> {timeLeft}
        </div>
      </div>

      <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "8px", textAlign: "center", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
        {isEnding && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#ef4444" }} className="pulse-bg" />}
        <p style={{ margin: "0 0 0.5rem 0", color: "var(--muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Último Lance Arrematante</p>
        <div style={{ fontSize: "3rem", fontWeight: "900", color: "#facc15", fontFamily: "monospace" }}>
          {formatCurrency(auc.current_price || 0)}
        </div>
        {auc.winner_name && (
          <div style={{ marginTop: "0.5rem", color: "var(--muted)", fontSize: "0.95rem", fontWeight: 600 }}>
            Líder Atual: <span style={{ color: "var(--text)" }}>{auc.winner_name}</span>
          </div>
        )}
      </div>

      {auc.status === 'active' ? (
        <button
          className="btn btn-primary shadow-glow"
          style={{ width: "100%", padding: "1rem", fontSize: "1.2rem", fontWeight: "bold", background: isEnding ? "rgba(239, 68, 68, 0.9)" : "linear-gradient(90deg, #eab308, #ca8a04)" }}
          onClick={async () => {
            // Basic real bid dispatch
            try {
              const res = await fetch("/api/leiloes/lance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item_id: auc.id })
              });
              if (!res.ok) {
                const err = await res.json();
                alert("Erro ao dar lance: " + (err.error || "Desconhecido"));
              }
            } catch (e) {
              alert("Erro de conexão");
            }
          }}
        >
          ENTRAR NO LEILÃO (1 Lance)
        </button>
      ) : auc.status === 'pending' ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>
          <Clock size={32} style={{ margin: "0 auto 1rem auto" }} />
          <p style={{ margin: 0, fontWeight: "bold" }}>Leilão não iniciado</p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>Aguarde o disparo pela administração.</p>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "rgba(239, 68, 68, 0.8)", padding: "1rem", border: "1px dashed rgba(239, 68, 68, 0.4)", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontWeight: "bold", fontSize: "1.1rem" }}>Leilão Encerrado</p>
          {auc.winner_name && (
            <p style={{ margin: "0.5rem 0 0 0", color: "var(--text)" }}>
              Arrematado por: <strong>{auc.winner_name}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
