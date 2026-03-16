"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RevenueData {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h3 style={{ margin: "0 0 1rem", color: "var(--muted)", width: "100%", textAlign: "left" }}>Faturamento Diário (Últimos 14 dias)</h3>
        <p style={{ color: "var(--muted)" }}>Nenhum dado financeiro disponível.</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDateLabel = (dateString: string) => {
    // Converts something like 2024-05-12 to "12/05"
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length < 3) return dateString;
    return `${parts[2]}/${parts[1]}`;
  }

  return (
    <div className="card" style={{ height: "100%", paddingBottom: "3rem" }}>
      <h3 style={{ margin: "0 0 1.5rem", color: "var(--text-color)" }}>Faturamento Diário (Últimos 14 dias)</h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(value: any) => `R$ ${value}`}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: any) => [formatCurrency(value), "Faturamento"]}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            />
            <Bar dataKey="revenue" fill="#6c63ff" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
