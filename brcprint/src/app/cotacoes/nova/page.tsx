"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ModelViewer from "@/components/ModelViewer";

const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Pricing calculation ───────────────────────────────────────────────────
function calcCosts(d: any) {
  if (!d.printer || !d.filament) return null;
  const print_time = Number(d.print_time_hours) || 0;
  const filament_g = Number(d.filament_used_g) || 0;
  const setup = Number(d.setup_time_hours) || 0;
  const post = Number(d.post_process_hours) || 0;
  const qty = Number(d.quantity) || 1;
  const kwh = Number(d.energy_kwh_price) || 0;
  const labor = Number(d.labor_hourly_rate) || 0;
  const margin = Number(d.profit_margin_pct) || 0;
  const loss = Number(d.loss_pct) || 0;
  const spare = Number(d.spare_parts_pct) || 0;
  const watts = Number(d.printer.power_watts) || 0;
  const purchase = Number(d.printer.purchase_price) || 0;
  const lifespan = Number(d.printer.lifespan_hours) || 1;
  const maint = Number(d.printer.maintenance_reserve_pct) || 0;
  const costKg = Number(d.filament.cost_per_kg) || 0;

  const cost_filament = parseFloat(((filament_g / 1000) * costKg * (1 + loss / 100)).toFixed(2));
  const cost_energy = parseFloat(((watts / 1000) * print_time * kwh).toFixed(2));
  const cost_depreciation = parseFloat(((purchase / lifespan) * print_time).toFixed(2));
  const cost_maintenance = parseFloat((cost_depreciation * (maint / 100)).toFixed(2));
  const cost_labor = parseFloat(((setup + post) * labor).toFixed(2));
  const subtotal = cost_filament + cost_energy + cost_depreciation + cost_maintenance + cost_labor;
  const cost_spare_parts = parseFloat(((subtotal * spare) / 100).toFixed(2));
  const cost_losses = parseFloat(((filament_g / 1000) * costKg * (loss / 100)).toFixed(2));
  const cost_total_production = parseFloat((subtotal + cost_spare_parts).toFixed(2));
  const profit_value = parseFloat(((cost_total_production * margin) / 100).toFixed(2));
  const base_final_price = parseFloat((cost_total_production + profit_value).toFixed(2));

  // Extras
  const extras_total = parseFloat(
    (d.extras || []).reduce((s: number, e: any) => s + Number(e.price || 0) * Number(e.quantity || 1), 0).toFixed(2)
  );
  const final_price = parseFloat((base_final_price + extras_total).toFixed(2));
  const final_price_per_unit = parseFloat((final_price / qty).toFixed(2));

  return {
    cost_filament,
    cost_energy,
    cost_depreciation,
    cost_maintenance,
    cost_labor,
    cost_losses,
    cost_spare_parts,
    cost_total_production,
    profit_value,
    base_final_price,
    extras_total,
    final_price,
    final_price_per_unit,
    bom_total: d.bom_total || 0
  };
}

interface Extra { name: string; type: "service" | "product"; price: string; quantity: string; }
const emptyExtra = (): Extra => ({ name: "", type: "service", price: "", quantity: "1" });

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="breakdown-row">
    <span className="breakdown-label">{label}</span>
    <span className="breakdown-value" style={accent ? { color: "var(--accent)" } : undefined}>{value}</span>
  </div>
);

const Inp = ({ label, value, onChange, type = "number", step = "0.01", required = false }: any) => (
  <div style={{ marginBottom: "1rem" }}>
    <label className="label">{label}</label>
    <input className="input" type={type} step={step} value={value ?? ""} onChange={onChange} required={required} />
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────
export default function NovaCotacaoPage() {
  const router = useRouter();
  const [printers, setPrinters] = useState<any[]>([]);
  const [filaments, setFilaments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "", client_id: "", printer_id: "", filament_id: "",
    print_time_hours: "", filament_used_g: "",
    setup_time_hours: "0.5", post_process_hours: "0", quantity: "1",
    notes: "", bom_total: 0,
    valid_days: "30",
    send_email: true,
    profit_margin_pct: "", loss_pct: "", spare_parts_pct: "",
    energy_kwh_price: "", labor_hourly_rate: "",
    request_id: ""
  });
  const [extras, setExtras] = useState<Extra[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [bomItems, setBomItems] = useState<any[]>([]); // { consumable_id, quantity, name, unit, cost }
  const [submitting, setSubmitting] = useState(false);
  const [isSlicing, setIsSlicing] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>("");

  const colorMap: { [key: string]: string } = {
    "Preto": "#1a1a1b",
    "Branco": "#f8f9fa",
    "Cinza": "#94a3b8",
    "Vermelho": "#ef4444",
    "Azul": "#3b82f6",
    "Verde": "#22c55e",
    "Amarelo": "#eab308",
    "Laranja": "#f97316",
    "Roxo": "#a855f7",
    "Rosa": "#ec4899",
    "Dourado": "#fbbf24",
    "Prata": "#cbd5e1",
    "Cobre": "#b45309",
    "Transparente": "rgba(255,255,255,0.2)",
    "Madeira": "#a36a3e",
    "Mármore": "#d1d5db"
  };

  const getColorHex = (colorName: string) => {
    const name = colorName.trim().split(" ")[0]; // Get first word
    return colorMap[name] || "#6c63ff";
  };

  // Upload States
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/printers").then(r => r.json()),
      fetch("/api/filaments").then(r => r.json()),
      fetch("/api/config").then(r => r.json()),
      fetch("/api/clients").then(r => r.json()),
      fetch("/api/consumables").then(r => r.json()),
    ]).then(([p, f, c, cl, cons]) => {
      setPrinters(p.filter((x: any) => x.active));
      setFilaments(f.filter((x: any) => x.active));
      setClients(cl);
      if (Array.isArray(cons)) setConsumables(cons);
      setForm(prev => ({
        ...prev,
        profit_margin_pct: c.default_profit_margin_pct?.toString() || "",
        loss_pct: c.default_loss_pct?.toString() || "",
        spare_parts_pct: c.spare_parts_reserve_pct?.toString() || "",
        energy_kwh_price: c.energy_kwh_price?.toString() || "",
        labor_hourly_rate: c.labor_hourly_rate?.toString() || "",
      }));
    }).then(() => {
      // Check for duplicate or request param
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const dupId = urlParams.get("duplicate");
        const reqId = urlParams.get("request_id");
        if (dupId) {
          fetch(`/api/quotes/${dupId}`).then(r => r.json()).then(q => {
            if (!q.error) {
              setForm(prev => ({
                ...prev,
                title: q.title ? `${q.title} (Cópia)` : "Cópia",
                client_id: q.client_id || "",
                printer_id: q.printer_id?.toString() || "",
                filament_id: q.filament_id?.toString() || "",
                print_time_hours: q.print_time_hours?.toString() || "",
                filament_used_g: q.filament_used_g?.toString() || "",
                setup_time_hours: q.setup_time_hours?.toString() || "0.5",
                post_process_hours: q.post_process_hours?.toString() || "0",
                quantity: q.quantity?.toString() || "1",
                notes: q.notes || "",
                valid_days: q.valid_days?.toString() || "30",
              }));
              if (q.extras && Array.isArray(q.extras)) {
                setExtras(q.extras);
              }
            }
          });
        } else if (reqId) {
          fetch("/api/quote-requests").then(r => r.json()).then(list => {
            const rc = list.find((x: any) => x.id === Number(reqId));
            if (rc) {
              setForm(prev => ({
                ...prev,
                request_id: reqId,
                client_id: rc.client_id || "",
                quantity: rc.quantity?.toString() || "1",
                notes: `Arquivo: ${rc.file_url}\nMaterial Preferido: ${rc.material_preference}\nCor Preferida: ${rc.color_preference}\nObservação do Cliente: ${rc.notes}`
              }));
            }
          });
        }
      }
    });
  }, []);

  const selectedPrinter = printers.find(p => p.id === Number(form.printer_id));
  const selectedFilament = filaments.find(f => f.id === Number(form.filament_id));

  const materialTypes = Array.from(new Set(filaments.map(f => f.type))).sort();
  const availableFilamentsForType = filaments.filter(f => f.type === selectedMaterialType);

  // Calculate BOM total cost for live preview
  const bomTotalCost = bomItems.reduce((acc, it) => acc + (Number(it.cost || 0) * Number(it.quantity || 0)), 0);

  const costs = calcCosts({
    ...form,
    printer: selectedPrinter,
    filament: selectedFilament,
    extras,
    bom_total: bomTotalCost
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  // Extras helpers
  const addExtra = () => setExtras(prev => [...prev, emptyExtra()]);
  const removeExtra = (i: number) => setExtras(prev => prev.filter((_, idx) => idx !== i));
  const setExtra = (i: number, field: keyof Extra, value: string) =>
    setExtras(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));

  // BOM helpers
  const addBomItem = (cons: any) => {
    if (bomItems.find(it => it.consumable_id === cons.id)) return;
    setBomItems(prev => [...prev, {
      consumable_id: cons.id,
      name: cons.name,
      unit: cons.unit_type,
      cost: cons.cost_per_unit,
      quantity: 1
    }]);
  };
  const removeBomItem = (id: number) => setBomItems(prev => prev.filter(it => it.consumable_id !== id));
  const setBomQty = (id: number, qty: string) =>
    setBomItems(prev => prev.map(it => it.consumable_id === id ? { ...it, quantity: qty } : it));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: '3d' | 'image') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const upRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error || "Erro no upload");

        if (type === '3d') {
          setFileUrls(prev => [...prev, upData.url]);
          if (i === 0 && !fileName) setFileName(file.name);
        } else {
          setReferenceImages(prev => [...prev, upData.url]);
        }
      }
    } catch (err) {
      alert("Erro ao enviar arquivo.");
      console.error(err);
    } finally {
      setUploadLoading(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const removeImage = (url: string) => setReferenceImages(prev => prev.filter(u => u !== url));
  const remove3dFile = (url: string) => setFileUrls(prev => prev.filter(u => u !== url));

  const handleAutoSlice = async () => {
    if (fileUrls.length === 0) {
      alert("Por favor, anexe ao menos um arquivo 3D antes de fatiar.");
      return;
    }
    setIsSlicing(true);
    try {
      const formData = new FormData();
      formData.append("infill", "20"); // default infill for manual quotes estimation

      for (const url of fileUrls) {
        const fileRes = await fetch(url);
        const blob = await fileRes.blob();
        const fileName = url.split('/').pop() || 'file.stl';
        formData.append("files", blob, fileName);
      }

      const sliceRes = await fetch("/api/slice", {
        method: "POST",
        body: formData
      });

      const sliceData = await sliceRes.json();
      if (!sliceRes.ok) throw new Error(sliceData.error || "Erro no fatiamento");

      setForm(prev => ({
        ...prev,
        print_time_hours: sliceData.print_time_hours?.toString() || "",
        filament_used_g: sliceData.weight_g?.toString() || ""
      }));

      alert(`Fatiamento concluído com sucesso! \nTempo: ${sliceData.print_time_hours}h | Peso: ${sliceData.weight_g}g`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao fatiar modelos.");
    } finally {
      setIsSlicing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        extras,
        file_urls: fileUrls,
        reference_images: referenceImages,
        bomItems: bomItems.map(it => ({ consumable_id: it.consumable_id, quantity: Number(it.quantity) }))
      }),
    });
    const data = await res.json();
    router.push(`/cotacoes/${data.id}`);
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Nova Cotação</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
          Preencha os dados para calcular o preço da peça
        </p>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>
        {/* ─── LEFT: form ─── */}
        <div>
          {/* Identificação */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem" }}>📋 Identificação</h2>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Título da cotação</label>
              <input className="input" type="text" placeholder="Ex: Suporte para câmera" value={form.title} onChange={set("title")} />
            </div>
            <div>
              <label className="label">Cliente (opcional)</label>
              <select className="input" value={(form as any).client_id} onChange={set("client_id")}>
                <option value="">Sem cliente vinculado</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` – ${c.company}` : ""}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label className="label">Validade da cotação</label>
              <select className="input" value={form.valid_days} onChange={set("valid_days")}>
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
              </select>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="send_email"
                checked={(form as any).send_email}
                onChange={(e) => setForm(prev => ({ ...prev, send_email: e.target.checked }))}
                style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
              />
              <label htmlFor="send_email" style={{ fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}>
                Enviar link por e-mail automaticamente
              </label>
            </div>
          </div>

          {/* Arquivos */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem" }}>📦 Arquivos 3D e Referências</h2>

            {/* 3D Files */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="label" style={{ margin: 0 }}>Modelos 3D (STL/OBJ/3MF)</label>
                <input type="file" ref={fileInputRef} accept=".stl,.obj,.3mf" multiple style={{ display: "none" }} onChange={(e) => handleFileUpload(e, '3d')} />
                <button type="button" className="btn btn-ghost" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}>
                  + Adicionar Modelo
                </button>
              </div>

              {fileUrls.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {fileUrls.map((url, i) => (
                    <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                      <div style={{ height: 400, background: "var(--surface2)" }}>
                        <ModelViewer url={url} color="#6c63ff" materialType={form.filament_id ? filaments.find(f => f.id === Number(form.filament_id))?.type : "PLA"} />
                      </div>
                      <button type="button" onClick={() => remove3dFile(url)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "2rem", border: "2px dashed var(--border)", borderRadius: "8px", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
                  Clique aqui para anexar arquivo 3D
                </div>
              )}
            </div>

            {/* Reference Images */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="label" style={{ margin: 0 }}>Imagens de Referência (Cores/Pintura)</label>
                <input type="file" ref={imgInputRef} accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleFileUpload(e, 'image')} />
                <button type="button" className="btn btn-ghost" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => imgInputRef.current?.click()} disabled={uploadLoading}>
                  + Adicionar Imagem
                </button>
              </div>

              {referenceImages.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {referenceImages.map((url, i) => (
                    <div key={i} style={{ position: "relative", width: 80, height: 80, borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                      <img src={url} alt="Referência" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => removeImage(url)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", width: 20, height: 20, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "1rem", border: "2px dashed var(--border)", borderRadius: "8px", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem", cursor: "pointer" }} onClick={() => imgInputRef.current?.click()}>
                  Clique aqui para anexar imagem JPEG/PNG
                </div>
              )}
            </div>

            {uploadLoading && <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--accent)", textAlign: "center" }}>Enviando arquivos...</div>}
          </div>

          {/* Equipamento */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem" }}>🖨️ Equipamento</h2>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Impressora *</label>
              <select className="input" value={form.printer_id} onChange={set("printer_id")} required>
                <option value="">Selecione a impressora…</option>
                {printers.map(p => <option key={p.id} value={p.id}>{p.name} – {p.power_watts}W, {Number(p.purchase_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">1. Escolha o Material</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {materialTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedMaterialType(type);
                      setForm(prev => ({ ...prev, filament_id: "" })); // Reset selection
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      border: selectedMaterialType === type ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: selectedMaterialType === type ? "var(--surface2)" : "transparent",
                      color: selectedMaterialType === type ? "var(--accent)" : "var(--muted)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      transition: "all 0.2s"
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {selectedMaterialType && (
              <div>
                <label className="label">2. Escolha a Cor / Filamento Disponível</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
                  {availableFilamentsForType.map(f => {
                    const isSel = Number(form.filament_id) === f.id;
                    const hex = getColorHex(f.color);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, filament_id: f.id.toString() }))}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          padding: "0.6rem",
                          borderRadius: "10px",
                          border: isSel ? "2px solid var(--accent)" : "1px solid var(--border)",
                          background: isSel ? "var(--surface2)" : "var(--surface)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s",
                          position: "relative"
                        }}
                      >
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: hex,
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: isSel ? `0 0 10px ${hex}88` : "none"
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {f.color}
                          </div>
                          <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>
                            R$ {Number(f.cost_per_kg).toFixed(0)}/kg
                          </div>
                        </div>
                        {isSel && (
                          <div style={{ position: "absolute", top: -8, right: -8, background: "var(--accent)", color: "white", width: "18px", height: "18px", borderRadius: "50%", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Parâmetros */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>⏱️ Parâmetros de Impressão</h2>
              <button
                type="button"
                onClick={handleAutoSlice}
                className="btn btn-primary"
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none" }}
                disabled={isSlicing || fileUrls.length === 0}
              >
                {isSlicing ? "⏳ Fatiando..." : "🔮 Fatiar e Estimar"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Inp label="Tempo de impressão (h) *" value={form.print_time_hours} onChange={set("print_time_hours")} required />
              <Inp label="Filamento usado (g) *" value={form.filament_used_g} onChange={set("filament_used_g")} required />
              <Inp label="Tempo de setup (h)" value={form.setup_time_hours} onChange={set("setup_time_hours")} />
              <Inp label="Pós-processamento (h)" value={form.post_process_hours} onChange={set("post_process_hours")} />
              <Inp label="Quantidade de peças" value={form.quantity} onChange={set("quantity")} step="1" />
            </div>
          </div>

          {/* Financeiros */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem" }}>
              💰 Parâmetros Financeiros <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: "0.8rem" }}>(sobrescreve config global)</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Inp label="Energia R$/kWh" value={form.energy_kwh_price} onChange={set("energy_kwh_price")} step="0.0001" />
              <Inp label="Mão de obra R$/h" value={form.labor_hourly_rate} onChange={set("labor_hourly_rate")} />
              <Inp label="Margem de lucro (%)" value={form.profit_margin_pct} onChange={set("profit_margin_pct")} />
              <Inp label="Perdas / falhas (%)" value={form.loss_pct} onChange={set("loss_pct")} />
              <Inp label="Peças de reposição (%)" value={form.spare_parts_pct} onChange={set("spare_parts_pct")} />
            </div>
          </div>

          {/* ── EXTRAS ── */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>📦 Produtos & Serviços Extras</h2>
              <button type="button" className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }} onClick={addExtra}>
                + Adicionar Item
              </button>
            </div>

            {extras.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: "1rem 0", fontSize: "0.875rem" }}>
                Nenhum extra adicionado.<br />
                <span style={{ fontSize: "0.78rem" }}>Ex: Modelagem 3D, argola de chaveiro, pós-processamento especial…</span>
              </div>
            )}

            {extras.map((ex, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 110px 100px 70px 36px", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "flex-end" }}>
                <div>
                  {i === 0 && <label className="label" style={{ fontSize: "0.7rem" }}>Descrição</label>}
                  <input className="input" style={{ padding: "0.45rem 0.6rem" }} placeholder="Ex: Modelagem 3D" value={ex.name}
                    onChange={e => setExtra(i, "name", e.target.value)} />
                </div>
                <div>
                  {i === 0 && <label className="label" style={{ fontSize: "0.7rem" }}>Tipo</label>}
                  <select className="input" style={{ padding: "0.45rem 0.5rem" }} value={ex.type}
                    onChange={e => setExtra(i, "type", e.target.value as any)}>
                    <option value="service">🔧 Serviço</option>
                    <option value="product">📦 Produto</option>
                  </select>
                </div>
                <div>
                  {i === 0 && <label className="label" style={{ fontSize: "0.7rem" }}>Preço unit. (R$)</label>}
                  <input className="input" style={{ padding: "0.45rem 0.6rem" }} type="number" step="0.01" placeholder="0.00" value={ex.price}
                    onChange={e => setExtra(i, "price", e.target.value)} />
                </div>
                <div>
                  {i === 0 && <label className="label" style={{ fontSize: "0.7rem" }}>Qtd</label>}
                  <input className="input" style={{ padding: "0.45rem 0.6rem" }} type="number" step="1" min="1" placeholder="1" value={ex.quantity}
                    onChange={e => setExtra(i, "quantity", e.target.value)} />
                </div>
                <div>
                  {i === 0 && <div style={{ height: "1.4rem" }} />}
                  <button type="button" onClick={() => removeExtra(i)}
                    style={{ width: 36, height: 36, border: "1px solid var(--border)", borderRadius: 8, background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: "1rem" }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {extras.length > 0 && (
              <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end", fontSize: "0.875rem", color: "var(--muted)" }}>
                Subtotal extras: <strong style={{ marginLeft: 8, color: "var(--text)" }}>
                  {fmt(extras.reduce((s, e) => s + Number(e.price || 0) * Number(e.quantity || 1), 0))}
                </strong>
              </div>
            )}
          </div>

          {/* ── BOM (Assembly) ── */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>🛠️ Montagem Complexa (BOM)</h2>
              <div style={{ position: "relative" }}>
                <select
                  className="btn btn-ghost"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", width: "auto" }}
                  onChange={(e) => {
                    const c = consumables.find(x => x.id === Number(e.target.value));
                    if (c) addBomItem(c);
                    e.target.value = "";
                  }}
                  value=""
                >
                  <option value="" disabled>+ Adicionar Item de Estoque</option>
                  {consumables.filter(c => !bomItems.find(it => it.consumable_id === c.id)).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({fmt(c.cost_per_unit || 0)}/{c.unit_type})</option>
                  ))}
                </select>
              </div>
            </div>

            {bomItems.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: "1rem 0", fontSize: "0.875rem" }}>
                Nenhum item de montagem vinculado.<br />
                <span style={{ fontSize: "0.78rem" }}>Ex: Parafusos, LEDs, motores, componentes eletrônicos…</span>
              </div>
            )}

            {bomItems.map((it, i) => (
              <div key={it.consumable_id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 36px", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "flex-end" }}>
                <div>
                  {i === 0 && <label className="label" style={{ fontSize: "0.7rem" }}>Item</label>}
                  <div style={{ padding: "0.45rem 0.6rem", background: "var(--surface2)", borderRadius: 8, fontSize: "0.9rem" }}>
                    {it.name}
                  </div>
                </div>
                <div>
                  {i === 0 && <label className="label" style={{ fontSize: "0.7rem" }}>Qtd ({it.unit})</label>}
                  <input className="input" style={{ padding: "0.45rem 0.6rem" }} type="number" step="0.01" min="0.01" value={it.quantity}
                    onChange={e => setBomQty(it.consumable_id, e.target.value)} />
                </div>
                <div>
                  {i === 0 && <label className="label" style={{ fontSize: "0.7rem" }}>Custo (R$)</label>}
                  <div style={{ padding: "0.45rem 0.6rem", fontSize: "0.9rem", color: "var(--muted)" }}>
                    {fmt(Number(it.cost || 0) * Number(it.quantity || 0))}
                  </div>
                </div>
                <div>
                  {i === 0 && <div style={{ height: "1.4rem" }} />}
                  <button type="button" onClick={() => removeBomItem(it.consumable_id)}
                    style={{ width: 36, height: 36, border: "1px solid var(--border)", borderRadius: 8, background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: "1rem" }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {bomItems.length > 0 && (
              <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end", fontSize: "0.875rem", color: "var(--muted)" }}>
                Total BOM: <strong style={{ marginLeft: 8, color: "var(--text)" }}>
                  {fmt(bomTotalCost)}
                </strong>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <label className="label">Observações</label>
            <textarea className="input" rows={3} value={form.notes} onChange={set("notes")} placeholder="Notas adicionais…" style={{ resize: "vertical" }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }} disabled={submitting}>
            {submitting ? "Calculando e salvando…" : "Calcular e Salvar Cotação"}
          </button>
        </div>

        {/* ─── RIGHT: live breakdown ─── */}
        <div className="card" style={{ position: "sticky", top: "2rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem" }}>📊 Breakdown de Custos</h2>
          {costs ? (
            <>
              <Row label="🧵 Filamento (c/ perdas)" value={fmt(costs.cost_filament)} />
              <Row label="⚡ Energia elétrica" value={fmt(costs.cost_energy)} />
              <Row label="📉 Depreciação impressora" value={fmt(costs.cost_depreciation)} />
              <Row label="🔧 Reserva manutenção" value={fmt(costs.cost_maintenance)} />
              <Row label="👷 Mão de obra" value={fmt(costs.cost_labor)} />
              <Row label="♻️ Peças de reposição" value={fmt(costs.cost_spare_parts)} />
              {costs.bom_total > 0 && <Row label="🛠️ Montagem (BOM)" value={fmt(costs.bom_total)} />}
              <div style={{ borderTop: "1px solid var(--border)", margin: "0.75rem 0" }} />
              <Row label="Custo total de produção" value={fmt(costs.cost_total_production)} accent />
              <Row label={`Margem de lucro (${form.profit_margin_pct}%)`} value={`+ ${fmt(costs.profit_value)}`} />

              {/* Extras preview */}
              {costs.extras_total > 0 && (
                <>
                  <div style={{ borderTop: "1px solid var(--border)", margin: "0.75rem 0" }} />
                  {extras.map((e, i) => (
                    <Row key={i}
                      label={`${e.type === "service" ? "🔧" : "📦"} ${e.name || "Extra"} ×${e.quantity}`}
                      value={fmt(Number(e.price || 0) * Number(e.quantity || 1))}
                    />
                  ))}
                  <Row label="📦 Subtotal extras" value={`+ ${fmt(costs.extras_total)}`} />
                </>
              )}

              {/* Final */}
              <div style={{ marginTop: "1rem", padding: "1rem", background: "linear-gradient(135deg,#6c63ff22,#22c55e11)", borderRadius: 10, border: "1px solid var(--accent)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Preço Final</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--green)", marginTop: 4 }}>
                  {fmt(costs.final_price_per_unit)}
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 400 }}>/peça</span>
                </div>
                {Number(form.quantity) > 1 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 4 }}>
                    Lote ({form.quantity} peças): {fmt(costs.final_price)}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--surface2)", borderRadius: 8 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Detalhes</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>📉 Perda embutida: {fmt(costs.cost_losses)}</div>
                {costs.extras_total > 0 && <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>📦 Extras: {fmt(costs.extras_total)}</div>}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: "2rem 0", fontSize: "0.875rem" }}>
              Selecione uma impressora e<br />um filamento para ver o breakdown
            </div>
          )}
        </div>
      </form >
    </div >
  );
}
