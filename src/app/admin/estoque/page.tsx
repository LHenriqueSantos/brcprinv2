"use client";

import { useEffect, useState } from "react";

export default function InventoryPage() {
  const [filaments, setFilaments] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"filaments" | "consumables">("filaments");

  // Filament state
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showLotModal, setShowLotModal] = useState(false);
  const [selectedFilament, setSelectedFilament] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);

  // Consumable state
  const [showConsumableModal, setShowConsumableModal] = useState(false);
  const [showNewConsumableModal, setShowNewConsumableModal] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<any>(null);

  // Shared Form state
  const [weight, setWeight] = useState("");
  const [cost, setCost] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Consumable Form State
  const [newConsName, setNewConsName] = useState("");
  const [newConsCategory, setNewConsCategory] = useState("Geral");
  const [newConsUnit, setNewConsUnit] = useState("unidade");
  const [newConsCost, setNewConsCost] = useState("");
  const [newConsStock, setNewConsStock] = useState("");
  const [newConsLot, setNewConsLot] = useState("");
  const [newConsRoll, setNewConsRoll] = useState("");
  const [newConsPurchaseDate, setNewConsPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      fetch("/api/filaments").then(r => r.json()),
      fetch("/api/consumables").then(r => r.json())
    ])
      .then(([fData, cData]) => {
        setFilaments(fData);
        // Backend might return error on consumables if migration fails
        if (Array.isArray(cData)) setConsumables(cData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFilament || !weight || !cost) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/estoque/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filamentId: selectedFilament.id,
          weight_g: Number(weight),
          cost_per_kg: Number(cost),
          lot_number: lotNumber,
          roll_number: rollNumber,
          purchase_date: purchaseDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setFilaments(prev => prev.map(f => f.id === selectedFilament.id ? data.filament : f));
        setShowEntryModal(false);
        setWeight("");
        setCost("");
        setLotNumber("");
        setRollNumber("");
        setPurchaseDate(new Date().toISOString().split('T')[0]);
      } else {
        alert(data.error || "Erro ao atualizar estoque.");
      }
    } catch (e) {
      alert("Erro de comunicação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (f: any) => {
    setSelectedFilament(f);
    setCost(f.cost_per_kg?.toString() || "");
    setLotNumber(f.lot_number || "");
    setRollNumber(f.roll_number || "");
    if (f.purchase_date) {
      setPurchaseDate(new Date(f.purchase_date).toISOString().split('T')[0]);
    } else {
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    }
    setShowEntryModal(true);
  };

  const openConsumableModal = (c: any) => {
    setSelectedConsumable(c);
    setCost(c.cost_per_unit?.toString() || "");
    setWeight(""); // Represents quantity here
    setLotNumber(c.lot_number || "");
    setRollNumber(c.roll_number || "");
    if (c.purchase_date) {
      setPurchaseDate(new Date(c.purchase_date).toISOString().split('T')[0]);
    } else {
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    }
    setShowConsumableModal(true);
  };

  const openLotsModal = async (f: any) => {
    setSelectedFilament(f);
    setWeight("1000");
    setCost(f.cost_per_kg?.toString() || "");
    setLotNumber(f.lot_number || "");
    setRollNumber("");
    if (f.purchase_date) {
      setPurchaseDate(new Date(f.purchase_date).toISOString().split('T')[0]);
    } else {
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    }
    setShowLotModal(true);
    try {
      const res = await fetch(`/api/admin/filaments/lots?filamentId=${f.id}`);
      const data = await res.json();
      setLots(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFilament || !lotNumber || !weight || !cost) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/filaments/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filament_id: selectedFilament.id,
          lot_number: lotNumber,
          roll_number: rollNumber,
          purchase_date: purchaseDate,
          initial_weight_g: Number(weight),
          cost_per_kg: Number(cost)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLots([data, ...lots]);
        setLotNumber("");
        setRollNumber("");
        setPurchaseDate(new Date().toISOString().split('T')[0]);

        // Also update the main filament stock (optional, since DB triggers might handle total,
        // but current manual entry also updates filaments table.
        // Let's call the same update endpoint or just fetch filaments again)
        const fRes = await fetch("/api/filaments");
        setFilaments(await fRes.json());
      } else {
        alert(data.error || "Erro ao criar lote.");
      }
    } catch (e) {
      alert("Erro de comunicação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLot = async (id: number) => {
    if (!confirm("Excluir este lote permanentemente?")) return;
    try {
      const res = await fetch(`/api/admin/filaments/lots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLots(lots.filter(l => l.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConsumableEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsumable || !weight || !cost) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/consumables/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumableId: selectedConsumable.id,
          quantity_added: Number(weight),
          cost_per_unit: Number(cost),
          lot_number: lotNumber,
          roll_number: rollNumber,
          purchase_date: purchaseDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setConsumables(prev => prev.map(c => c.id === selectedConsumable.id ? data.consumable : c));
        setShowConsumableModal(false);
        setWeight("");
        setCost("");
        setLotNumber("");
        setRollNumber("");
        setPurchaseDate(new Date().toISOString().split('T')[0]);
      } else {
        alert(data.error || "Erro ao atualizar estoque de insumo.");
      }
    } catch (e) {
      alert("Erro de comunicação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateConsumable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsName || !newConsCost) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/consumables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newConsName,
          category: newConsCategory,
          unit_type: newConsUnit,
          cost_per_unit: Number(newConsCost),
          stock_current: Number(newConsStock || 0),
          stock_min_warning: 0,
          lot_number: newConsLot,
          roll_number: newConsRoll,
          purchase_date: newConsPurchaseDate
        })
      });
      const data = await res.json();
      if (data.success) {
        // Recarregar insumos
        const cData = await fetch("/api/consumables").then(r => r.json());
        if (Array.isArray(cData)) setConsumables(cData);
        setShowNewConsumableModal(false);
        setNewConsName(""); setNewConsCost(""); setNewConsStock("");
        setNewConsLot(""); setNewConsRoll(""); setNewConsPurchaseDate(new Date().toISOString().split('T')[0]);
      } else {
        alert(data.error || "Erro ao criar insumo.");
      }
    } catch (e) {
      alert("Erro de comunicação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFilament = async (id: number, name: string) => {
    if (!confirm(`Excluir o filamento/resina "${name}" permanentemente?`)) return;
    try {
      const res = await fetch(`/api/filaments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFilaments(filaments.filter(f => f.id !== id));
      } else {
        alert("Erro ao excluir. O item pode estar vinculado a cotações.");
      }
    } catch (e) {
      alert("Erro de comunicação.");
    }
  };

  const handleDeleteConsumable = async (id: number, name: string) => {
    if (!confirm(`Excluir o insumo "${name}" permanentemente?`)) return;
    try {
      const res = await fetch(`/api/consumables/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConsumables(consumables.filter(c => c.id !== id));
      } else {
        alert("Erro ao excluir. O item pode estar vinculado a cotações.");
      }
    } catch (e) {
      alert("Erro de comunicação.");
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>Carregando estoque…</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 900, marginBottom: "0.5rem", background: "linear-gradient(135deg, white, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          📦 Gestão de Estoque
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>
          Controle de filamentos, tintas, resinas, embalagens e alertas de reposição.
        </p>
      </header>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => setActiveTab("filaments")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "filaments" ? "3px solid var(--accent)" : "3px solid transparent",
            color: activeTab === "filaments" ? "var(--text)" : "var(--muted)",
            fontWeight: activeTab === "filaments" ? 800 : 500,
            cursor: "pointer",
            fontSize: "1rem",
            transition: "all 0.2s"
          }}
        >
          🧵 Filamentos e Resinas 3D
        </button>
        <button
          onClick={() => setActiveTab("consumables")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "consumables" ? "3px solid var(--accent)" : "3px solid transparent",
            color: activeTab === "consumables" ? "var(--text)" : "var(--muted)",
            fontWeight: activeTab === "consumables" ? 800 : 500,
            cursor: "pointer",
            fontSize: "1rem",
            transition: "all 0.2s"
          }}
        >
          🎨 Insumos e Consumíveis
        </button>
      </div>

      {activeTab === "filaments" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filaments.map(f => {
            const pct = Math.min(100, Math.max(0, (Number(f.current_weight_g) / Number(f.initial_weight_g || 1000)) * 100));
            const isCritical = Number(f.current_weight_g) <= Number(f.min_stock_warning);

            return (
              <div key={f.id} className="card" style={{ padding: "1.5rem", position: "relative", border: isCritical ? "1px solid #ef4444" : "1px solid var(--border)" }}>
                {isCritical && (
                  <div style={{ position: "absolute", top: "-10px", right: "1rem", background: "#ef4444", color: "white", fontSize: "0.65rem", fontWeight: 800, padding: "0.25rem 0.6rem", borderRadius: "20px", textTransform: "uppercase" }}>
                    Estoque Baixo
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {f.color && (() => {
                        const n = f.color.toLowerCase();
                        let hex = null;
                        if(n.includes("pret") || n.includes("black")) hex = "#000000";
                        else if(n.includes("branc") || n.includes("white")) hex = "#ffffff";
                        else if(n.includes("vermelh") || n.includes("red")) hex = "#ef4444";
                        else if(n.includes("azul") || n.includes("blue")) hex = "#3b82f6";
                        else if(n.includes("verd") || n.includes("green")) hex = "#22c55e";
                        else if(n.includes("amarel") || n.includes("yellow")) hex = "#eab308";
                        else if(n.includes("laranj") || n.includes("orange")) hex = "#f97316";
                        else if(n.includes("rox") || n.includes("purple") || n.includes("violeta")) hex = "#a855f7";
                        else if(n.includes("rosa") || n.includes("pink")) hex = "#ec4899";
                        else if(n.includes("cinz") || n.includes("prat") || n.includes("gray") || n.includes("silver")) hex = "#94a3b8";
                        else if(n.includes("ouro") || n.includes("dourad") || n.includes("gold")) hex = "#ca8a04";
                        else if(n.includes("marrom") || n.includes("madeira") || n.includes("brown")) hex = "#78350f";
                        else if(n.startsWith("#")) hex = n;

                        return hex ? (
                          <span style={{
                            display: "inline-block",
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            background: hex,
                            border: "1px solid rgba(255,255,255,0.2)",
                            boxShadow: `0 0 6px ${hex}80`
                          }} title={`Cor: ${f.color}`} />
                        ) : null;
                      })()}
                      {f.name}
                    </h3>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                      {f.brand} · {f.type} {f.color ? `· ${f.color}` : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <button
                      onClick={() => handleDeleteFilament(f.id, f.name)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", padding: "0 0 0.5rem 0", opacity: 0.6 }}
                      title="Excluir"
                      onMouseOver={e => e.currentTarget.style.opacity = "1"}
                      onMouseOut={e => e.currentTarget.style.opacity = "0.6"}
                    >
                      🗑️
                    </button>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent)" }}>{Number(f.current_weight_g).toFixed(0)}g</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text)" }}>
                      ≈ {(Number(f.current_weight_g) / Number(f.initial_weight_g || 1000)).toFixed(1)} rolos
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                    <span>Nível do Rolo</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface2)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: isCritical ? "#ef4444" : "var(--accent)", transition: "width 0.5s ease-out" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", padding: "1rem", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "1rem" }}>
                  <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Último Lote / Rolo</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                      {f.lot_number || "–"} {f.roll_number ? `· Rolo ${f.roll_number}` : ""}
                      {f.purchase_date && <span style={{ marginLeft: "0.5rem", fontWeight: 400, color: "var(--muted)" }}>({new Date(f.purchase_date).toLocaleDateString('pt-BR')})</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase" }}>Custo p/ kg</div>
                    <div style={{ fontWeight: 700 }}>R$ {Number(f.cost_per_kg).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase" }}>Total Comprado</div>
                    <div style={{ fontWeight: 700 }}>{(Number(f.total_purchased_g || 0) / 1000).toFixed(1)}kg</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <button
                    onClick={() => openModal(f)}
                    style={{ padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface)")}
                  >
                    📥 NF
                  </button>
                  <button
                    onClick={() => openLotsModal(f)}
                    style={{ padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
                  >
                    🧵 Lotes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "consumables" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowNewConsumableModal(true)}
            >
              + Novo Insumo Generalizado
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {consumables.map(c => {
              const isCritical = Number(c.stock_current) <= Number(c.stock_min_warning);

              return (
                <div key={c.id} className="card" style={{ padding: "1.5rem", position: "relative", border: isCritical ? "1px solid #ef4444" : "1px solid var(--border)" }}>
                  {isCritical && (
                    <div style={{ position: "absolute", top: "-10px", right: "1rem", background: "#ef4444", color: "white", fontSize: "0.65rem", fontWeight: 800, padding: "0.25rem 0.6rem", borderRadius: "20px", textTransform: "uppercase" }}>
                      Estoque Baixo
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>{c.name}</h3>
                      <span style={{
                        display: "inline-block",
                        marginTop: "0.5rem",
                        padding: "2px 8px",
                        background: "var(--surface2)",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        color: "var(--text)"
                      }}>
                        {c.category}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <button
                        onClick={() => handleDeleteConsumable(c.id, c.name)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", padding: "0 0 0.5rem 0", opacity: 0.6 }}
                        title="Excluir"
                        onMouseOver={e => e.currentTarget.style.opacity = "1"}
                        onMouseOut={e => e.currentTarget.style.opacity = "0.6"}
                      >
                        🗑️
                      </button>
                      <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--accent)" }}>
                        {Number(c.stock_current).toFixed(1)} <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{c.unit_type}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", padding: "1rem", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "1rem" }}>
                    <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Rastreabilidade</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                        {c.lot_number || "–"} {c.roll_number ? `· Rolo ${c.roll_number}` : ""}
                        {c.purchase_date && <span style={{ marginLeft: "0.5rem", fontWeight: 400, color: "var(--muted)" }}>({new Date(c.purchase_date).toLocaleDateString('pt-BR')})</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase" }}>Custo p/ {c.unit_type}</div>
                      <div style={{ fontWeight: 700 }}>R$ {Number(c.cost_per_unit).toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase" }}>Total Comprado</div>
                      <div style={{ fontWeight: 700 }}>{Number(c.total_purchased || 0).toFixed(0)} {c.unit_type}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => openConsumableModal(c)}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "white"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}
                  >
                    📦 Repor Estoque
                  </button>
                </div>
              );
            })}

            {consumables.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", background: "var(--surface2)", borderRadius: "12px", color: "var(--muted)" }}>
                Nenhum insumo (tinta, lixa, embalagem) cadastrado. <br />Clique em "Novo Insumo Generalizado" para adicionar.
              </div>
            )}
          </div>
        </>
      )}

      {showEntryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 450, width: "100%", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.5rem" }}>Entrada de Material (Filamento)</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Registrar novo lote para <strong>{selectedFilament?.name}</strong>.
            </p>

            <form onSubmit={handleManualEntry}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="label">Peso Adicionado (gramas)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Ex: 1000"
                  required
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label className="label">Novo Custo por KG (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="Ex: 85.00"
                  required
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                />
                <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                  * Este valor será usado para futuras cotações de {selectedFilament?.name}.
                </p>
              </div>

              <div style={{ padding: "1rem", background: "var(--surface2)", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent)", textTransform: "uppercase" }}>Rastreabilidade / NF</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Lote</label>
                    <input className="input" placeholder="Ex: L2024" value={lotNumber} onChange={e => setLotNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Nº Rolo</label>
                    <input className="input" placeholder="Ex: 01" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Data de Compra</label>
                  <input className="input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Gravando…" : "Confirmar Entrada"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, border: "1px solid var(--border)" }}
                  onClick={() => setShowEntryModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConsumableModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 450, width: "100%", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.5rem" }}>Repor Insumo</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Adicionar mais {selectedConsumable?.unit_type}s para <strong>{selectedConsumable?.name}</strong>.
            </p>

            <form onSubmit={handleConsumableEntry}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="label">Quantidade Adicionada ({selectedConsumable?.unit_type})</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="Ex: 5"
                  required
                  value={weight} // using weight state for generic quantity
                  onChange={e => setWeight(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label className="label">Custo Unitário Agora (R$ por {selectedConsumable?.unit_type})</label>
                <input
                  type="number"
                  step="0.001"
                  className="input"
                  placeholder="Ex: 0.50"
                  required
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                />
              </div>

              <div style={{ padding: "1rem", background: "var(--surface2)", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent)", textTransform: "uppercase" }}>Rastreabilidade</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Lote/ID</label>
                    <input className="input" placeholder="Ex: LOT-XYZ" value={lotNumber} onChange={e => setLotNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Posição/Rolo</label>
                    <input className="input" placeholder="Ex: 01" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Data de Compra</label>
                  <input className="input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Gravando…" : "Repor"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, border: "1px solid var(--border)" }}
                  onClick={() => setShowConsumableModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewConsumableModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.5rem" }}>Novo Insumo</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Cadastre um novo tipo de tinta, resina, lixa ou material geral.
            </p>

            <form onSubmit={handleCreateConsumable}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="label">Nome do Insumo</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Primer Spray Branco Brilhante"
                  required
                  value={newConsName}
                  onChange={e => setNewConsName(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label className="label">Categoria</label>
                  <select className="input" value={newConsCategory} onChange={e => setNewConsCategory(e.target.value)}>
                    <option value="Tinta">Tinta / Acabamento</option>
                    <option value="Cola">Colas / Adesivos</option>
                    <option value="Lixa">Lixas / Abrasivos</option>
                    <option value="Embalagem">Embalagens</option>
                    <option value="Geral">Insumo Geral</option>
                  </select>
                </div>
                <div>
                  <label className="label">Unidade de Medida</label>
                  <select className="input" value={newConsUnit} onChange={e => setNewConsUnit(e.target.value)}>
                    <option value="un">Unidade (un)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="folha">Folhas</option>
                    <option value="cm">Centímetros (cm)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                <div>
                  <label className="label">Estoque Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="Ex: 10"
                    required
                    value={newConsStock}
                    onChange={e => setNewConsStock(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Custo p/ Unidade (R$)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="input"
                    placeholder="Ex: 15.00"
                    required
                    value={newConsCost}
                    onChange={e => setNewConsCost(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: "1rem", background: "var(--surface2)", borderRadius: "8px", marginBottom: "2rem", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent)", textTransform: "uppercase" }}>Opcional: Rastreabilidade</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Lote</label>
                    <input className="input" placeholder="Lote NF" value={newConsLot} onChange={e => setNewConsLot(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Nº Rolo/Item</label>
                    <input className="input" placeholder="Ex: 01" value={newConsRoll} onChange={e => setNewConsRoll(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Data de Compra</label>
                  <input className="input" type="date" value={newConsPurchaseDate} onChange={e => setNewConsPurchaseDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? "Cadastrando..." : "Cadastrar Insumo"}
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, border: "1px solid var(--border)" }} onClick={() => setShowNewConsumableModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showLotModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 650, width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0 }}>Rolos e Lotes (Traceability)</h2>
              <button className="btn btn-ghost" onClick={() => setShowLotModal(false)}>✖</button>
            </div>

            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Rastreie rolos individuais de <strong>{selectedFilament?.name}</strong>.
            </p>

            <form onSubmit={handleCreateLot} style={{ background: "var(--surface2)", padding: "1.5rem", borderRadius: 12, marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1rem" }}>➕ Novo Rolo (Entrada)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="label">Lote</label>
                  <input className="input" placeholder="Ex: ABC-123" required value={lotNumber} onChange={e => setLotNumber(e.target.value)} />
                </div>
                <div>
                  <label className="label">Nº Rolo</label>
                  <input className="input" placeholder="Ex: 01" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="label">Peso (g)</label>
                  <input className="input" type="number" required value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div>
                  <label className="label">Custo/kg (R$)</label>
                  <input className="input" type="number" step="0.01" required value={cost} onChange={e => setCost(e.target.value)} />
                </div>
                <div>
                  <label className="label">Data de Compra</label>
                  <input className="input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isSubmitting}>
                {isSubmitting ? "Gravando..." : "✅ Registrar novo rolo"}
              </button>
            </form>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "var(--surface2)" }}>
                  <th style={{ padding: "0.75rem", fontSize: "0.8rem" }}>LOTE / ROLO</th>
                  <th style={{ padding: "0.75rem", fontSize: "0.8rem" }}>DATA COMPRA</th>
                  <th style={{ padding: "0.75rem", fontSize: "0.8rem" }}>PESO ATUAL</th>
                  <th style={{ padding: "0.75rem", fontSize: "0.8rem", textAlign: "right" }}>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {lots.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 700 }}>{l.lot_number}</div>
                      {l.roll_number && <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Rolo: {l.roll_number}</div>}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.85rem" }}>
                      {l.purchase_date ? new Date(l.purchase_date).toLocaleDateString('pt-BR') : "–"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 700 }}>{Number(l.current_weight_g).toFixed(0)}g</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>R$ {Number(l.cost_per_kg).toFixed(2)}/kg</div>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button onClick={() => handleDeleteLot(l.id)} style={{ padding: "0.3rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", opacity: "0.6" }} onMouseOver={e => e.currentTarget.style.opacity = "1"} onMouseOut={e => e.currentTarget.style.opacity = "0.6"}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {lots.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Nenhum rolo individual rastreado ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
