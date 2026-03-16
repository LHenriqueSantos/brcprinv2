"use client";

import React from "react";
import ScheduleCard from "./ScheduleCard";

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

type Printer = {
  id: number;
  name: string;
  type: string;
};

interface PrinterLaneProps {
  printer: Printer;
  quotes: Quote[];
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (printerId: number) => void;
  formatShortDate: (dateStr: string | null) => string;
  config?: any;
}

export default function PrinterLane({ printer, quotes, config, onDragStart, onDragOver, onDrop, formatShortDate }: PrinterLaneProps) {
  const scheduledQuotes = quotes
    .filter(q => q.printer_id === printer.id)
    .sort((a, b) => new Date(a.scheduled_start || 0).getTime() - new Date(b.scheduled_start || 0).getTime());

  // Calculate rough total schedule load for this printer
  const totalHrs = scheduledQuotes.reduce((acc, q) => acc + Number(q.print_time_hours || 0), 0);

  return (
    <div
      onDragOver={onDragOver}
      onDrop={() => onDrop(printer.id)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1.5rem",
        minHeight: "150px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            🖨️
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>{printer.name}</h3>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>Tipo: {printer.type}</div>
          </div>
        </div>
        <div style={{ fontSize: "0.8rem", padding: "4px 8px", borderRadius: "12px", background: "var(--surface2)", fontWeight: 600 }}>
          Fila Ocupada: {totalHrs.toFixed(1)}h
        </div>
      </div>

      {/* Timeline Track */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem",
        background: "rgba(0,0,0,0.1)",
        borderRadius: "8px",
        minHeight: "80px",
        overflowX: "auto",
        position: "relative"
      }}>
        {/* Peak Hour Visual Zones (Tarifa Branca) */}
        {config?.energy_peak_start && config?.energy_peak_end && (
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "75%", // Mock position since it's not a real Gantt scroll yet
            width: "12.5%", // Represents 3 hours in a 24h view
            background: "rgba(255, 0, 0, 0.1)",
            borderLeft: "1px dashed rgba(255, 0, 0, 0.3)",
            borderRight: "1px dashed rgba(255, 0, 0, 0.3)",
            zIndex: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pointerEvents: "none"
          }}>
            <span style={{ fontSize: "0.6rem", color: "var(--red)", fontWeight: 700, paddingBottom: "2px" }}>TARIF. PONTA</span>
          </div>
        )}

        {scheduledQuotes.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: "0.8rem", width: "100%", textAlign: "center", fontStyle: "italic" }}>
            Máquina Ociosa. Arraste um pedido aqui.
          </div>
        ) : (
          scheduledQuotes.map(q => (
            <ScheduleCard
              key={q.id}
              quote={q}
              config={config}
              onDragStart={onDragStart}
              formatShortDate={formatShortDate}
              isTimeline
            />
          ))
        )}
      </div>
    </div>
  );
}
