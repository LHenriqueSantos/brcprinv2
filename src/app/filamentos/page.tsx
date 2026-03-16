"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Package, TrendingUp } from "lucide-react";

interface Filament {
  id: number;
  name: string;
  brand: string;
  type: string;
  color: string;
  lot_number: string;
  roll_number: string;
  purchase_date: string;
  cost_per_kg: number;
  density_g_cm3: number;
  active: number;
  initial_weight_g: number;
  current_weight_g: number;
  min_stock_warning: number;
  total_purchased_g: number;
}

const empty = () => ({
  name: "",
  brand: "",
  type: "PLA",
  color: "",
  lot_number: "",
  roll_number: "",
  purchase_date: new Date().toISOString().split('T')[0],
  cost_per_kg: "",
  density_g_cm3: "1.24",
  initial_weight_g: "1000",
  current_weight_g: "1000",
  min_stock_warning: "100",
  total_purchased_g: "1000"
});

const TYPES = ["PLA", "PETG", "ABS", "TPU", "ASA", "NYLON", "PC", "FLEX", "HIPS", "PLA-CF", "PETG-CF", "POM", "PVA", "OUTRO"];

const typeBadge = (t: string) => {
  const map: any = { PLA: "badge-pla", PETG: "badge-petg", ABS: "badge-abs", TPU: "badge-tpu" };
  return map[t] || "badge-default";
};

// Helper components outside the main component to prevent focus loss
const F = ({ label, fkey, type = "text", step, form, setForm }: any) => (
  <div style={{ marginBottom: "1rem" }}>
    <label className="label">{label}</label>
    <input
      className="input"
      type={type}
      step={step}
      value={form[fkey] ?? ""}
      onChange={(e) => setForm({ ...form, [fkey]: e.target.value })}
    />
  </div>
);

export default function FilamentosPage() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Filament | null>(null);
  const [form, setForm] = useState<any>(empty());

  const load = () => fetch("/api/filaments").then((r) => r.json()).then(setFilaments);

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty());
    setModal(true);
  };

  const openEdit = (f: Filament) => {
    setEditing(f);
    setForm({
      ...f,
      purchase_date: f.purchase_date ? f.purchase_date.split('T')[0] : "",
      cost_per_kg: f.cost_per_kg?.toString() || "",
      density_g_cm3: f.density_g_cm3?.toString() || "",
      initial_weight_g: f.initial_weight_g?.toString() || "",
      current_weight_g: f.current_weight_g?.toString() || "",
      min_stock_warning: f.min_stock_warning?.toString() || "",
      total_purchased_g: f.total_purchased_g?.toString() || ""
    });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/filaments/${editing.id}` : "/api/filaments";

      const payload = {
        ...form,
        cost_per_kg: parseFloat(form.cost_per_kg) || 0,
        density_g_cm3: parseFloat(form.density_g_cm3) || 1.24,
        initial_weight_g: parseFloat(form.initial_weight_g) || 1000,
        current_weight_g: parseFloat(form.current_weight_g) || 1000,
        min_stock_warning: parseFloat(form.min_stock_warning) || 100,
        total_purchased_g: parseFloat(form.total_purchased_g || form.initial_weight_g) || 1000,
        active: editing ? editing.active : 1
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar filamento");

      setModal(false);
      load();
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Erro ao salvar: " + err.message);
    }
  };

  const deactivate = async (id: number) => {
    if (!confirm("Desativar este filamento?")) return;
    try {
      const res = await fetch(`/api/filaments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao desativar");
      }
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeFilaments = filaments.filter(f => f.active);
  const totalWeightKg = activeFilaments.reduce((acc, f) => acc + (Number(f.current_weight_g) / 1000), 0);
  const totalLockedValue = activeFilaments.reduce((acc, f) => {
    const kilos = Number(f.current_weight_g) / 1000;
    return acc + (kilos * Number(f.cost_per_kg));
  }, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Gestão de Filamentos</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>Controle de estoque, custos e Valuation material</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Adicionar Rolo</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Valuation em Estoque (R$)</p>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {formatCurrency(totalLockedValue)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Volume Total de Plástico</p>
            <p className="text-2xl font-bold text-slate-800">{totalWeightKg.toFixed(2)} kg</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome / Marca</th><th>Tipo</th><th>Traceability</th><th>Estoque</th><th>Custo (R$/kg)</th><th>Ações</th></tr></thead>
            <tbody>
              {activeFilaments.map((f) => {
                const pct = Math.max(0, Math.min(100, (Number(f.current_weight_g) / Number(f.initial_weight_g)) * 100));
                const isCritical = Number(f.current_weight_g) <= Number(f.min_stock_warning);
                return (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{f.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{f.brand} • {f.color || "–"}</div>
                    </td>
                    <td><span className={`badge ${typeBadge(f.type)}`}>{f.type}</span></td>
                    <td>
                      <div style={{ fontSize: "0.8rem", color: "var(--text)" }}>
                        {f.lot_number && <div>Lote: <span style={{ fontWeight: 600 }}>{f.lot_number}</span></div>}
                        {f.roll_number && <div>Rolo: <span style={{ fontWeight: 600 }}>{f.roll_number}</span></div>}
                        {f.purchase_date && <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{new Date(f.purchase_date).toLocaleDateString('pt-BR')}</div>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "4px", color: isCritical ? "var(--red)" : "inherit" }}>
                        {Number(f.current_weight_g).toFixed(1)}g <span style={{ color: "var(--muted)", fontWeight: 400 }}>/ {f.initial_weight_g}g</span>
                      </div>
                      <div style={{ width: "100%", maxWidth: "120px", height: "6px", background: "var(--surface2)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border)" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: isCritical ? "var(--red)" : "var(--green)", transition: "width 0.3s" }}></div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(Number(f.cost_per_kg))}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--accent)" }}>{formatCurrency(f.cost_per_kg / 1000)}/g</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-ghost" style={{ padding: "0.3rem 0.75rem" }} onClick={() => openEdit(f)}>✏️</button>
                        <button className="btn btn-danger" style={{ padding: "0.3rem 0.75rem" }} onClick={() => deactivate(f.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {activeFilaments.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>Nenhum filamento cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? "Editar Filamento" : "Novo Filamento"}</h2>
            <form onSubmit={save}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <F label="Nome" fkey="name" form={form} setForm={setForm} />
                <F label="Marca" fkey="brand" form={form} setForm={setForm} />

                <div style={{ marginBottom: "1rem" }}>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <F label="Cor" fkey="color" form={form} setForm={setForm} />
              </div>

              <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rastreabilidade / Lotes</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <F label="Lote" fkey="lot_number" form={form} setForm={setForm} />
                  <F label="Nº do Rolo" fkey="roll_number" form={form} setForm={setForm} />
                  <F label="Data de Compra" fkey="purchase_date" type="date" form={form} setForm={setForm} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <F label="Custo por kg (R$)" fkey="cost_per_kg" type="number" step="0.01" form={form} setForm={setForm} />
                <F label="Densidade (g/cm³)" fkey="density_g_cm3" type="number" step="0.0001" form={form} setForm={setForm} />
                <F label="Peso Inicial Bruto (g)" fkey="initial_weight_g" type="number" step="1" form={form} setForm={setForm} />
                <F label="Estoque Atual (g)" fkey="current_weight_g" type="number" step="0.1" form={form} setForm={setForm} />
                <F label="Aviso de baixo estoque (g)" fkey="min_stock_warning" type="number" step="1" form={form} setForm={setForm} />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Salvar</button>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
