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
  filament_name?: string;
  created_at: string;
}

export default function AdminCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [filaments, setFilaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", category: "", image_url: "", stl_file_url: "", base_price: "", filament_id: "", is_digital_sale: false, digital_price: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [catRes, filRes] = await Promise.all([
        fetch("/api/admin/catalog").then(r => r.json()),
        fetch("/api/filaments").then(r => r.json())
      ]);
      if (catRes.error) console.error("Catalog API Error:", catRes.error);
      setItems(Array.isArray(catRes) ? catRes : []);
      setFilaments(Array.isArray(filRes) ? filRes : []);
    } catch (e) {
      console.error("Failed to load catalog data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => {
    setEditingItem(null);
    setForm({ title: "", description: "", category: "", image_url: "", stl_file_url: "", base_price: "", filament_id: "", is_digital_sale: false, digital_price: "" });
    setImageFile(null);
    setStlFile(null);
    setModalOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setForm({
      title: item.title, description: item.description || "", category: item.category || "",
      image_url: item.image_url || "", stl_file_url: item.stl_file_url || "",
      base_price: Number(item.base_price).toString(), filament_id: item.filament_id?.toString() || "",
      is_digital_sale: item.is_digital_sale === 1, digital_price: Number(item.digital_price).toString()
    });
    setImageFile(null);
    setStlFile(null);
    setModalOpen(true);
  };

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

      if (imageFile) finalImageUrl = await uploadFile(imageFile);
      if (stlFile) finalStlUrl = await uploadFile(stlFile);

      if (!finalImageUrl || !finalStlUrl) {
        alert("Imagem e Arquivo STL são obrigatórios para itens do catálogo.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...form,
        base_price: Number(form.base_price),
        filament_id: form.filament_id ? Number(form.filament_id) : null,
        image_url: finalImageUrl,
        stl_file_url: finalStlUrl,
        is_digital_sale: form.is_digital_sale ? 1 : 0,
        digital_price: form.is_digital_sale ? Number(form.digital_price) : 0
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
          <div className="card" style={{ maxWidth: 600, width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
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
                  <label className="label">Foto do Produto (PNG/JPG)</label>
                  {form.image_url && <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--accent)" }}>Imagem atual carregada</div>}
                  <input type="file" accept="image/*" className="input" onChange={e => { if (e.target.files) setImageFile(e.target.files[0]) }} required={!form.image_url} />
                </div>

                <div>
                  <label className="label">Arquivo STL (Modelo 3D)</label>
                  {form.stl_file_url && <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--accent)" }}>STL atual carregado</div>}
                  <input type="file" accept=".stl,.obj" className="input" onChange={e => { if (e.target.files) setStlFile(e.target.files[0]) }} required={!form.stl_file_url} />
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
                      <span style={{ fontWeight: 600 }}>Habilitar Venda Digital</span>
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
