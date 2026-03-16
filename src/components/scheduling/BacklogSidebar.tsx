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

interface BacklogSidebarProps {
  quotes: Quote[];
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  formatShortDate: (dateStr: string | null) => string;
}

export default function BacklogSidebar({ quotes, onDragStart, onDragOver, onDrop, formatShortDate }: BacklogSidebarProps) {
  return (
    <div
      style={{ width: "300px", padding: "1.5rem", borderRight: "1px solid var(--border)", background: "var(--surface)", overflowY: "auto" }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <h3 style={{ fontSize: "0.9rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem" }}>
        Fila de Espera ({quotes.length})
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {quotes.map(q => (
          <ScheduleCard
            key={q.id}
            quote={q}
            onDragStart={onDragStart}
            formatShortDate={formatShortDate}
          />
        ))}
        {quotes.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--muted)", fontSize: "0.85rem" }}>
            Nenhum pedido na fila.
          </div>
        )}
      </div>
    </div>
  );
}
