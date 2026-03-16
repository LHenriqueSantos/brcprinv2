"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface CatalogItem {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string;
  stl_file_url: string;
  base_price: string;
  filament_id: number;
  active: number;
  is_digital_sale: number;
  digital_price: string;
  image_urls: string[] | null;
  is_ready_to_ship: number;
  ready_stock_details: Array<{ color: string; quantity: number; image_url: string; image_file?: File | null }> | null;
  allow_custom_order: number;
  filament_name?: string;

  // Phase 8 additions
  gcode_url?: string;
  auto_print_enabled?: number;
  target_printer_id?: number | null;

  created_at: string;
}

export default function AdminCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [filaments, setFilaments] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", category: "", image_url: "", stl_file_url: "",
    base_price: "", filament_id: "", is_digital_sale: false, digital_price: "",
    image_urls: [] as string[], is_ready_to_ship: false,
    ready_stock_details: [] as Array<{ color: string; quantity: number; image_url: string; image_file?: File | null }>,
    allow_custom_order: true,
    gcode_url: "", auto_print_enabled: false, target_printer_id: "" as string | number
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [gcodeFile, setGcodeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [catRes, filRes, printersRes] = await Promise.all([
        fetch("/api/admin/catalog").then(r => r.json()),
        fetch("/api/filaments").then(r => r.json()),
        fetch("/api/printers").then(r => r.json())
      ]);
      if (catRes.error) console.error("Catalog API Error:", catRes.error);
      setItems(Array.isArray(catRes) ? catRes : []);
      setFilaments(Array.isArray(filRes) ? filRes : []);
      setPrinters(Array.isArray(printersRes) ? printersRes : []);
    } catch (e) {
      console.error("Failed to load catalog data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => {
    setEditingItem(null);
    setForm({
      title: "", description: "", category: "", image_url: "", stl_file_url: "",
      base_price: "", filament_id: "", is_digital_sale: false, digital_price: "",
      image_urls: [], is_ready_to_ship: false, ready_stock_details: [], allow_custom_order: true,
      gcode_url: "", auto_print_enabled: false, target_printer_id: ""
    });
    setImageFile(null);
    setStlFile(null);
    setGcodeFile(null);
    setAuxImageFiles([]);
    setModalOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setForm({
      title: item.title, description: item.description || "", category: item.category || "",
      image_url: item.image_url || "", stl_file_url: item.stl_file_url || "",
      base_price: Number(item.base_price).toString(), filament_id: item.filament_id?.toString() || "",
      is_digital_sale: item.is_digital_sale === 1, digital_price: Number(item.digital_price).toString(),
      image_urls: Array.isArray(item.image_urls) ? item.image_urls : [],
      is_ready_to_ship: item.is_ready_to_ship === 1,
      ready_stock_details: Array.isArray(item.ready_stock_details) ? item.ready_stock_details : [],
      allow_custom_order: item.allow_custom_order !== 0,
      gcode_url: item.gcode_url || "",
      auto_print_enabled: item.auto_print_enabled === 1,
      target_printer_id: item.target_printer_id || ""
    });
    setImageFile(null);
    setStlFile(null);
    setGcodeFile(null);
    setAuxImageFiles([]);
    setModalOpen(true);
  };

  const [auxImageFiles, setAuxImageFiles] = useState<File[]>([]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalImageUrl = form.image_url;
      let finalStlUrl = form.stl_file_url;
      let finalGcodeUrl = form.gcode_url;
      let finalImageUrls = [...form.image_urls];

      if (imageFile) finalImageUrl = await uploadFile(imageFile);
      if (stlFile) finalStlUrl = await uploadFile(stlFile);
      if (gcodeFile) finalGcodeUrl = await uploadFile(gcodeFile);

      // Upload aux images
      for (const file of auxImageFiles) {
        const url = await uploadFile(file);
        finalImageUrls.push(url);
      }

      if (!finalImageUrl || !finalStlUrl) {
        alert("Imagem principal e Arquivo STL são obrigatórios para itens do catálogo.");
        setIsSubmitting(false);
        return;
      }

      // Upload ready stock variation images
      const processedReadyStock = [];
      for (const stock of form.ready_stock_details) {
        let stockImageUrl = stock.image_url;
        if (stock.image_file) {
          stockImageUrl = await uploadFile(stock.image_file);
        }
        processedReadyStock.push({
          color: stock.color,
          quantity: stock.quantity,
          image_url: stockImageUrl
        });
      }

      const payload = {
        ...form,
        base_price: Number(form.base_price),
        filament_id: form.filament_id ? Number(form.filament_id) : null,
        target_printer_id: form.target_printer_id ? Number(form.target_printer_id) : null,
        image_url: finalImageUrl,
        stl_file_url: finalStlUrl,
        gcode_url: finalGcodeUrl,
        is_digital_sale: form.is_digital_sale ? 1 : 0,
        digital_price: form.is_digital_sale ? Number(form.digital_price) : 0,
        auto_print_enabled: form.auto_print_enabled ? 1 : 0,
        image_urls: finalImageUrls,
        is_ready_to_ship: form.is_ready_to_ship,
        ready_stock_details: processedReadyStock,
        allow_custom_order: form.allow_custom_order
      };

      const url = editingItem ? `/api/admin/catalog/${editingItem.id}` : "/api/admin/catalog";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await res.text());

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deactivateItem = async (id: number) => {
    if (!confirm("Remover este item do catálogo público?")) return;
    await fetch(`/api/admin/catalog/${id}`, { method: "DELETE" });
    loadData();
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Carregando catálogo...</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>Catálogo / Portfólio</h1>
          <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
            Peças pré-cadastradas disponíveis para encomenda instantânea pelo cliente.
          </p>
        </div>
        <button onClick={openNew} className="btn btn-primary">+ Adicionar Item</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {items.filter(i => i.active).map(item => (
          <div key={item.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", width: "100%", height: "200px", background: "var(--surface2)" }}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Sem Foto</div>
              )}
              {item.category && (
                <span style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600 }}>
                  {item.category}
                </span>
              )}
              {item.auto_print_enabled === 1 && (
                <span style={{ position: "absolute", top: "10px", right: "10px", background: "var(--purple)", color: "white", padding: "4px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 800 }}>
                  ⚡ Zero-Click
                </span>
              )}
            </div>
            <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>{item.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "0 0 1rem", flex: 1 }}>
                {item.description ? (item.description.length > 80 ? item.description.substring(0, 80) + "..." : item.description) : "Sem descrição"}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase" }}>Físico</div>
                  <div style={{ fontWeight: 800, color: "var(--accent)" }}>
                    R$ {Number(item.base_price).toFixed(2)}
                  </div>
                  {item.is_ready_to_ship === 1 && (
                    <div style={{ marginTop: "0.25rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 700 }}>Pronta Entrega</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
                        {(() => {
                          const stock = Array.isArray(item.ready_stock_details) ? item.ready_stock_details : [];
                          const total = stock.reduce((acc: number, s: any) => acc + (Number(s.quantity) || 0), 0);
                          return `Estoque: ${total} un | ${stock.length} variações`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase" }}>Digital</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: item.is_digital_sale ? "var(--accent)" : "var(--muted)" }}>
                    {item.is_digital_sale ? `R$ ${Number(item.digital_price).toFixed(2)}` : "Indisponível"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => openEdit(item)} className="btn btn-ghost" style={{ flex: 1, padding: "0.5rem", border: "1px solid var(--border)" }}>Editar</button>
                <button onClick={() => deactivateItem(item.id)} className="btn btn-danger" style={{ flex: 1, padding: "0.5rem" }}>Inativar</button>
              </div>
            </div>
          </div>
        ))}
        {items.filter(i => i.active).length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem", color: "var(--muted)", background: "var(--surface2)", borderRadius: "12px" }}>
            <p style={{ marginBottom: "1rem" }}>Ainda não há itens no catálogo público.</p>
            <button onClick={openNew} className="btn btn-primary">Adicionar Primeira Peça</button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 650, width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1.5rem" }}>
              {editingItem ? "Editar Item do Catálogo" : "Novo Item do Catálogo"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Título da Peça</label>
                  <input required type="text" className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Vaso Groot" />
                </div>

                <div>
                  <label className="label">Categoria</label>
                  <input type="text" className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex: Decoração" />
                </div>

                <div>
                  <label className="label">Preço Base sugerido (R$)</label>
                  <input required type="number" step="0.01" className="input" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} placeholder="Ex: 45.00" />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Descrição Curta</label>
                  <textarea rows={3} className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do produto..."></textarea>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Material Recomendado (Opcional)</label>
                  <select className="input" value={form.filament_id} onChange={e => setForm({ ...form, filament_id: e.target.value })}>
                    <option value="">-- Deixar o cliente escolher --</option>
                    {filaments.filter(f => f.active).map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.type} - {f.color})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Foto Principal (PNG/JPG)</label>
                  {form.image_url && <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--accent)" }}>Imagem atual carregada</div>}
                  <input type="file" accept="image/*" className="input" onChange={e => { if (e.target.files) setImageFile(e.target.files[0]) }} required={!form.image_url} />
                </div>

                <div>
                  <label className="label">Fotos Secundárias e Variações</label>
                  <input type="file" accept="image/*" multiple className="input" onChange={e => { if (e.target.files) setAuxImageFiles(Array.from(e.target.files)) }} />
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {form.image_urls.map((url, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={url} alt={`img-${i}`} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                        <button type="button" onClick={() => setForm({ ...form, image_urls: form.image_urls.filter(x => x !== url) })} style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", borderRadius: "50%", width: 16, height: 16, border: "none", fontSize: "10px", cursor: "pointer" }}>x</button>
                      </div>
                    ))}
                    {auxImageFiles.length > 0 && <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>+{auxImageFiles.length} novas files</span>}
                  </div>
                </div>

                <div>
                  <label className="label">Arquivo STL (Modelo 3D genérico)</label>
                  {form.stl_file_url && <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--accent)" }}>STL atual carregado</div>}
                  <input type="file" accept=".stl,.obj" className="input" onChange={e => { if (e.target.files) setStlFile(e.target.files[0]) }} required={!form.stl_file_url} />
                </div>

                {/* Bloco de Pronta Entrega */}
                <div style={{ gridColumn: "1 / -1", marginTop: "1rem", background: "var(--surface2)", padding: "1.5rem", borderRadius: "12px", border: form.is_ready_to_ship ? "1px solid #10b981" : "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem" }}>Produto à Pronta Entrega</h3>
                      <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>Venda unidades que já estão impressas em estoque, sem aguardar fila de produção.</p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.is_ready_to_ship}
                        onChange={e => {
                          const checked = e.target.checked;
                          let newDetails = [...form.ready_stock_details];
                          if (checked && newDetails.length === 0) {
                            newDetails = [{ color: "", quantity: 1, image_url: "", image_file: null }];
                          }
                          setForm({ ...form, is_ready_to_ship: checked, ready_stock_details: newDetails });
                        }}
                        style={{ width: "1.5rem", height: "1.5rem", accentColor: "#10b981" }}
                      />
                      <span style={{ fontWeight: 600 }}>Pronta Entrega</span>
                    </label>
                  </div>

                  {form.is_ready_to_ship && (
                    <div style={{ background: "var(--surface)", padding: "1rem", borderRadius: "8px" }}>

                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
                        {form.ready_stock_details.map((stock, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", background: "var(--surface2)", padding: "1rem", borderRadius: "8px" }}>
                            <div style={{ flex: 2 }}>
                              <label className="label">Cor / Variação</label>
                              <input type="text" className="input" value={stock.color} onChange={e => { const ns = [...form.ready_stock_details]; ns[idx].color = e.target.value; setForm({ ...form, ready_stock_details: ns }); }} placeholder="Ex: Vermelho Brilhante" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label className="label">Qtd.</label>
                              <input type="number" className="input" value={stock.quantity} onChange={e => { const ns = [...form.ready_stock_details]; ns[idx].quantity = Number(e.target.value); setForm({ ...form, ready_stock_details: ns }); }} min="0" />
                            </div>
                            <div style={{ flex: 2 }}>
                              <label className="label">Foto (Opcional)</label>
                              <input
                                type="file"
                                accept="image/*"
                                className="input"
                                onChange={e => {
                                  const ns = [...form.ready_stock_details];
                                  if (e.target.files && e.target.files.length > 0) {
                                    ns[idx].image_file = e.target.files[0];
                                    ns[idx].image_url = ""; // clear old url if assigning new file
                                  }
                                  setForm({ ...form, ready_stock_details: ns });
                                }}
                              />
                              {stock.image_url && !stock.image_file && <div style={{ fontSize: "0.7rem", marginTop: "4px", color: "var(--accent)" }}>Imagem na nuvem</div>}
                              {stock.image_file && <div style={{ fontSize: "0.7rem", marginTop: "4px", color: "#10b981" }}>Pronta para upload</div>}
                            </div>
                            <button type="button" onClick={() => { const ns = [...form.ready_stock_details]; ns.splice(idx, 1); setForm({ ...form, ready_stock_details: ns }); }} className="btn btn-danger" style={{ padding: "0.6rem 0.8rem" }}>X</button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setForm({ ...form, ready_stock_details: [...form.ready_stock_details, { color: "", quantity: 1, image_url: "", image_file: null }] })} className="btn btn-ghost" style={{ border: "1px dashed var(--border)", width: "100%", padding: "1rem" }}>
                        + Adicionar Opção de Cor / Estoque
                      </button>

                      <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={form.allow_custom_order}
                            onChange={e => setForm({ ...form, allow_custom_order: e.target.checked })}
                            style={{ width: "1.2rem", height: "1.2rem", accentColor: "var(--accent)" }}
                          />
                          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Permitir sob encomenda caso acabe o estoque (Imprimir do Zero)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bloco Zero-Click Integration */}
                <div style={{ gridColumn: "1 / -1", marginTop: "1rem", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))", padding: "1.5rem", borderRadius: "12px", border: form.auto_print_enabled ? "1px solid var(--purple)" : "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--purple)" }}>⚡ Integração Slicer (Zero-Click)</h3>
                      <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>Quando comprado, envia o G-code direto para a impressora e inicia automaticamente (API OctoPrint/Moonraker necessária).</p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.auto_print_enabled}
                        onChange={e => setForm({ ...form, auto_print_enabled: e.target.checked })}
                        style={{ width: "1.5rem", height: "1.5rem", accentColor: "var(--purple)" }}
                      />
                      <span style={{ fontWeight: 600 }}>Zero-Click</span>
                    </label>
                  </div>

                  {form.auto_print_enabled && (
                    <div style={{ background: "var(--surface)", padding: "1rem", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label className="label" style={{ color: "var(--purple)" }}>Impressora Alvo de Disparo</label>
                        <select
                          className="input"
                          required={form.auto_print_enabled}
                          value={form.target_printer_id}
                          onChange={e => setForm({ ...form, target_printer_id: e.target.value })}
                        >
                          <option value="">Selecione uma Impressora (Com API)</option>
                          {printers.filter(p => p.active && p.api_type && p.api_type !== 'none').map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.api_type.toUpperCase()}) - {p.ip_address || "Sem IP"}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label">Upload do `.gcode` Pré-Fatiado</label>
                        {form.gcode_url && <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--purple)", fontWeight: 700 }}>✓ G-code atual salvo e vinculado</div>}
                        <input
                          type="file"
                          accept=".gcode"
                          className="input"
                          onChange={e => { if (e.target.files) setGcodeFile(e.target.files[0]) }}
                          required={form.auto_print_enabled && !form.gcode_url}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Venda Digital */}
                <div style={{ gridColumn: "1 / -1", marginTop: "1rem", background: "var(--surface2)", padding: "1.5rem", borderRadius: "12px", border: form.is_digital_sale ? "1px solid var(--accent)" : "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem" }}>Venda de Arquivo Digital (.STL)</h3>
                      <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>Permita que o cliente compre e faça o download do modelo 3D diretamente.</p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.is_digital_sale}
                        onChange={e => setForm({ ...form, is_digital_sale: e.target.checked })}
                        style={{ width: "1.5rem", height: "1.5rem", accentColor: "var(--accent)" }}
                      />
                      <span style={{ fontWeight: 600 }}>Venda Digital</span>
                    </label>
                  </div>

                  {form.is_digital_sale && (
                    <div style={{ background: "var(--surface)", padding: "1rem", borderRadius: "8px" }}>
                      <label className="label">Preço do Arquivo (R$)</label>
                      <input
                        required={form.is_digital_sale}
                        type="number"
                        step="0.01"
                        className="input"
                        value={form.digital_price}
                        onChange={e => setForm({ ...form, digital_price: e.target.value })}
                        placeholder="Ex: 15.00"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando e Fazendo Upload..." : "Salvar no Catálogo"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
