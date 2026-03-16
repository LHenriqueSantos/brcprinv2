"use client";

import React from "react";

type Quote = {
  id: number;
  title: string;
  status: string;
  client_name: string;
  print_time_hours: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  printer_id: number | null;
};

interface ScheduleCardProps {
  quote: Quote;
  onDragStart: (e: React.DragEvent, id: number) => void;
  formatShortDate: (dateStr: string | null) => string;
  isTimeline?: boolean;
  config?: any;
}

export default function ScheduleCard({ quote, onDragStart, formatShortDate, isTimeline = false, config }: ScheduleCardProps) {
  // Logic to determine if scheduled in Peak hours
  let energyStatus: 'offpeak' | 'peak' | 'unknown' = 'unknown';
  if (config && quote.scheduled_start) {
    const start = new Date(quote.scheduled_start);
    const timeStr = start.toTimeString().split(' ')[0]; // HH:MM:SS
    if (config.energy_peak_start && config.energy_peak_end) {
      if (config.energy_peak_start < config.energy_peak_end) {
        energyStatus = (timeStr >= config.energy_peak_start && timeStr < config.energy_peak_end) ? 'peak' : 'offpeak';
      } else {
        energyStatus = (timeStr >= config.energy_peak_start || timeStr < config.energy_peak_end) ? 'peak' : 'offpeak';
      }
    }
  }

  // Base width mapped roughly to hours: 1hr = 40px, max 300px
  const cardWidth = isTimeline ? Math.max(120, Math.min(400, (quote.print_time_hours || 1) * 30)) : undefined;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, quote.id)}
      style={{
        padding: "1rem",
        background: isTimeline
          ? (quote.status === 'in_production' ? "rgba(108, 99, 255, 0.2)" : "var(--surface2)")
          : "var(--surface2)",
        borderRadius: isTimeline ? "6px" : "8px",
        border: `1px solid ${isTimeline && quote.status === 'in_production' ? 'var(--accent)' : 'var(--border)'}`,
        cursor: "grab",
        boxShadow: isTimeline ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
        transition: "transform 0.1s",
        minWidth: cardWidth ? `${cardWidth}px` : undefined,
        position: isTimeline ? "relative" : undefined
      }}
      className={isTimeline ? "" : "hover-glow"}
      title={isTimeline ? "Arraste de volta para a fila para cancelar agendamento." : undefined}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isTimeline ? "0.5rem" : "0.25rem" }}>
        <div style={{
          fontSize: isTimeline ? "0.8rem" : "0.7rem",
          color: isTimeline ? "var(--text)" : "var(--accent)",
          fontWeight: 700,
          whiteSpace: isTimeline ? "nowrap" : "normal",
          overflow: isTimeline ? "hidden" : "visible",
          textOverflow: isTimeline ? "ellipsis" : "clip",
          maxWidth: isTimeline ? "80%" : "none"
        }}>
          {isTimeline ? `#${quote.id} - ${quote.title}` : `Pedido #${quote.id}`}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {energyStatus !== 'unknown' && (
            <span
              title={energyStatus === 'peak' ? "Horário de Ponta (Caro)" : "Horário Fora de Ponta (Econômico)"}
              style={{ color: energyStatus === 'peak' ? "var(--red)" : "#2ecc71", cursor: "help" }}
            >
              ⚡
            </span>
          )}
          {isTimeline && <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{quote.print_time_hours}h</div>}
        </div>
      </div>

      {!isTimeline && (
        <>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>{quote.title || "Sem Título"}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Cliente: {quote.client_name || "Avulso"}</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, marginTop: "0.5rem", display: "inline-block", background: "var(--surface)", padding: "2px 6px", borderRadius: "4px" }}>
            ⏱️ {Number(quote.print_time_hours || 0).toFixed(1)}h
          </div>
        </>
      )}

      {isTimeline && (
        <>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
            <span>▶ {formatShortDate(quote.scheduled_start)}</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
            <span>⏹ {formatShortDate(quote.scheduled_end)}</span>
          </div>
        </>
      )}
    </div>
  );
}
