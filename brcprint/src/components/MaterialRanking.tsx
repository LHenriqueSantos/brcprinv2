"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface MaterialData {
  material_name: string;
  material_type: string;
  total_grams: number;
}

interface MaterialRankingProps {
  data: MaterialData[];
}

const COLORS = ['#6c63ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

export default function MaterialRanking({ data }: MaterialRankingProps) {
  return (
    <div className="card" style={{ height: "450px", padding: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1.5rem", fontWeight: 700 }}>Materiais Mais Utilizados</h3>
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis dataKey="material_name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text)', fontWeight: 600, fontSize: 12 }} />
            <Tooltip
              formatter={(v: any) => [`${Number(v).toFixed(0)}g`, "Consumo"]}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
            />
            <Bar dataKey="total_grams" radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
