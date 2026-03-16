"use client";

import React from "react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}

export default function KPICard({ title, value, subtitle, icon, color = "#6c63ff" }: KPICardProps) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", borderLeft: `4px solid ${color}` }}>
      <div style={{
        background: `${color}15`,
        color: color,
        width: 48,
        height: 48,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)", fontWeight: 500 }}>{title}</h3>
        <div style={{ margin: "0.25rem 0", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-color)" }}>
          {value}
        </div>
        {subtitle && <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{subtitle}</div>}
      </div>
    </div>
  );
}
