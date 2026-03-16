"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MonthData {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

interface EvolutionChartProps {
  data: MonthData[];
}

export default function EvolutionChart({ data }: EvolutionChartProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="card" style={{ height: "450px", padding: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1.5rem", fontWeight: 700 }}>Evolução Financeira</h3>
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={(v) => `R$ ${v}`} />
            <Tooltip
              formatter={(v: any) => formatCurrency(v)}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Area name="Receita" type="monotone" dataKey="revenue" stroke="#6c63ff" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            <Area name="Lucro" type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
