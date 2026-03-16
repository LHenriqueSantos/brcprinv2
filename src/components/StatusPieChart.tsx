"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface StatusData {
  status: string;
  count: number;
  color: string;
}

interface StatusPieChartProps {
  data: StatusData[];
}

export default function StatusPieChart({ data }: StatusPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ height: "450px", padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1.5rem", color: "var(--text-color)" }}>Conversão de Cotações</h3>
        <div style={{ height: "350px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <p style={{ color: "var(--muted)" }}>Nenhum dado disponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ height: "450px", padding: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1.5rem", color: "var(--text-color)" }}>Conversão de Cotações</h3>
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="count"
              nameKey="status"
              stroke="none"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                if (percent < 0.05) return null;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: "12px", fontWeight: "bold" }}>
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [value, name]}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: "10px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
