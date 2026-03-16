"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, UploadCloud, Settings, Trash2, X } from "lucide-react";

export default function ParametricModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedSchema, setExtractedSchema] = useState<any[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    basePrice: "0",
    active: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scadFile, setScadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/admin/scad-models");
      if (res.ok) {
        setModels(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScadFile(file);
    setExtracting(true);
    setExtractedSchema(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/scad/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (data.schema) {
        setExtractedSchema(data.schema);
        alert(`Arquivo analisado! Foram encontradas ${data.schema.length} variáveis paramétricas.`);
      } else {
        alert(`Erro na extração: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Falha: ${e.message}`);
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && (!scadFile || !extractedSchema)) {
      alert("Envie um arquivo SCAD e aguarde a extração do Schema.");
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("title", formData.title);
    fd.append("description", formData.description || "");
    fd.append("category", formData.category);
    fd.append("base_price", formData.basePrice);
    fd.append("active", formData.active.toString());

    if (scadFile) {
      fd.append("scad_file", scadFile);
    }
    if (extractedSchema) {
      fd.append("parameters_schema", JSON.stringify(extractedSchema));
    }
    if (imageFile) fd.append("image", imageFile);

    try {
      const url = editingId ? `/api/admin/scad-models/${editingId}` : "/api/admin/scad-models";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      if (res.ok) {
        alert(editingId ? "Modelo atualizado com sucesso." : "Modelo inserido no catálogo parametrizado com sucesso.");
        setExtractedSchema(null);
        setScadFile(null);
        setImageFile(null);
        setIsDialogOpen(false);
        setEditingId(null);
        fetchModels();
      } else {
        throw new Error(await res.text());
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (model: any) => {
    setEditingId(model.id);
    setFormData({
      title: model.title,
      description: model.description || "",
      category: model.category,
      basePrice: model.base_price.toString(),
      active: !!model.active,
    });
    setExtractedSchema(typeof model.parameters_schema === 'string' ? JSON.parse(model.parameters_schema) : model.parameters_schema);
    setImageFile(null);
    setScadFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Tem certeza que deseja apagar este modelo permanentemente?")) return;
    try {
      const res = await fetch(`/api/admin/scad-models/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchModels();
      } else {
        throw new Error("Erro ao apagar modelo");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      category: "",
      basePrice: "0",
      active: true,
    });
    setExtractedSchema(null);
    setScadFile(null);
    setImageFile(null);
    setIsDialogOpen(false);
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Catálogo Paramétrico (OpenSCAD)</h1>
          <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>Gerencie modelos interativos de chaveiros, vasos e peças customizáveis.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={16} /> Novo Modelo Paramétrico
        </button>
      </div>

      {isDialogOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--bg)", width: "100%", maxWidth: "600px", borderRadius: "12px", maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--border)", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--bg)", zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{editingId ? "Editar Modelo Paramétrico" : "Cadastrar Modelo Paramétrico"}</h2>
              <button
                type="button"
                onClick={resetForm}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Título (Ex: Chaveiro com Nome)</label>
                  <input className="input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <label className="label">Categoria (Ex: Brindes)</label>
                  <input className="input" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Descrição Curta</label>
                <textarea className="input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Preço Base Fixo (R$)</label>
                  <input className="input" type="number" step="0.01" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={formData.active ? "true" : "false"} onChange={e => setFormData({ ...formData, active: e.target.value === "true" })}>
                    <option value="true">Ativo (Público)</option>
                    <option value="false">Inativo (Rascunho)</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: "1.25rem", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)" }}>
                  <Settings size={16} /> Motor OpenSCAD (.scad)
                </h3>

                <div>
                  <label className="label">Arquivo SCAD (*.scad) {editingId ? "(Opcional para substituição)" : ""}</label>
                  <input
                    type="file"
                    accept=".scad"
                    required={!editingId}
                    onChange={handleScadUpload}
                    style={{ width: "100%", padding: "0.5rem", border: "1px dashed var(--border)", borderRadius: "6px", background: "var(--bg)" }}
                  />
                </div>

                {extracting && <div style={{ fontSize: "0.85rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.5rem" }}><Loader2 size={14} className="animate-spin" /> Extraindo propriedades customizáveis...</div>}

                {extractedSchema && (
                  <div style={{ fontSize: "0.85rem", background: "rgba(99, 102, 241, 0.1)", padding: "1rem", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "6px" }}>
                    <p style={{ fontWeight: 600, color: "var(--accent)", margin: "0 0 0.5rem 0" }}>Schema de Variáveis Encontradas ({extractedSchema.length}):</p>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text)" }}>
                      {extractedSchema.map((sch, i) => (
                        <li key={i} style={{ marginBottom: "0.25rem" }}>
                          <code style={{ background: "var(--bg)", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>{sch.name}</code>
                          <span style={{ fontSize: "0.75rem", opacity: 0.7, marginLeft: "0.3rem" }}>({sch.type})</span> - Default: "{sch.default}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Capa / Imagem Ilustrativa {editingId ? "(Opcional para substituição)" : ""}</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: "0.5rem", border: "1px dashed var(--border)", borderRadius: "6px", background: "var(--bg)" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || (!editingId && !extractedSchema)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  {editingId ? "Salvar Alterações" : "Salvar e Habilitar Formulário"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)", textAlign: "left", fontSize: "0.85rem", color: "var(--muted)" }}>
              <th style={{ padding: "1rem" }}>Imagem</th>
              <th style={{ padding: "1rem" }}>Título</th>
              <th style={{ padding: "1rem" }}>Variáveis ($)</th>
              <th style={{ padding: "1rem" }}>Preço Base</th>
              <th style={{ padding: "1rem" }}>Status</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Carregando catálogo...</td></tr>
            ) : models.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Nenhum modelo paramétrico cadastrado ainda.</td></tr>
            ) : (
              models.map((m: any) => {
                const schema = typeof m.parameters_schema === 'string' ? JSON.parse(m.parameters_schema) : m.parameters_schema;
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <img src={m.image_url || "/brcprint.png"} alt={m.title} style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>{m.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{m.category}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "6px", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent)", fontSize: "0.75rem", fontWeight: 700 }}>
                        {schema?.length || 0} inputs customizáveis
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text)" }}>R$ {Number(m.base_price).toFixed(2)}</td>
                    <td style={{ padding: "1rem" }}>
                      {m.active ? (
                        <span style={{ color: "#059669", background: "rgba(5, 150, 105, 0.1)", padding: "0.2rem 0.6rem", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700 }}>Ativo</span>
                      ) : (
                        <span style={{ color: "var(--muted)", background: "var(--surface2)", padding: "0.2rem 0.6rem", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700 }}>Inativo</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <button onClick={() => handleEdit(m)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0.4rem", borderRadius: 6 }}><Settings size={18} /></button>
                        <button onClick={() => handleDelete(m.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.4rem", borderRadius: 6 }}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
