"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Rocket, Clock, Image as ImageIcon, CheckCircle, Tag, Edit, PauseCircle } from "lucide-react";

export default function LeiloesAdminPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    retail_value: "",
    time_increment: "15",
    end_time: "",
    min_sale_price: "0",
    bot_enabled: false,
    bot_max_price: "0",
    video_url: "",
    weight: "",
    dimensions: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);

  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/admin/auctions");
      if (res.ok) {
        setAuctions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fd = new FormData();
    fd.append("title", formData.title);
    fd.append("description", formData.description);
    fd.append("retail_value", formData.retail_value);
    fd.append("time_increment", formData.time_increment);
    fd.append("min_sale_price", formData.min_sale_price);
    fd.append("bot_enabled", formData.bot_enabled ? "1" : "0");
    fd.append("bot_max_price", formData.bot_max_price);
    if (formData.video_url) fd.append("video_url", formData.video_url);
    if (formData.weight) fd.append("weight", formData.weight);
    if (formData.dimensions) fd.append("dimensions", formData.dimensions);
    fd.append("status", "pending");

    // Format datetime-local to MySQL DATETIME
    const formattedDate = formData.end_time.replace("T", " ") + ":00";
    fd.append("end_time", formattedDate);

    if (imageFile) fd.append("image", imageFile);
    additionalImages.forEach((file, index) => {
      fd.append("additional_images", file);
    });

    try {
      const url = editingId ? `/api/admin/auctions/${editingId}` : "/api/admin/auctions";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, body: fd });
      if (res.ok) {
        alert(editingId ? "Leilão Atualizado!" : "Leilão Criado! (Status: Aguardando Disparo)");
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({ title: "", description: "", retail_value: "", time_increment: "15", end_time: "", min_sale_price: "0", bot_enabled: false, bot_max_price: "0", video_url: "", weight: "", dimensions: "" });
        setImageFile(null);
        setAdditionalImages([]);
        fetchAuctions();
      } else {
        const data = await res.json();
        alert(`Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Falha: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    const formattedEndTime = a.end_time ? new Date(a.end_time).toISOString().slice(0, 16) : "";
    setFormData({
      title: a.title || "",
      description: a.description || "",
      retail_value: a.retail_value ? String(a.retail_value) : "",
      time_increment: a.time_increment ? String(a.time_increment) : "15",
      end_time: formattedEndTime,
      min_sale_price: a.min_sale_price ? String(a.min_sale_price) : "0",
      bot_enabled: a.bot_enabled === 1,
      bot_max_price: a.bot_max_price ? String(a.bot_max_price) : "0",
      video_url: a.video_url || "",
      weight: a.weight || "",
      dimensions: a.dimensions || ""
    });
    setImageFile(null);
    setAdditionalImages([]);
    setIsDialogOpen(true);
  };

  const handleSuspend = async (id: number) => {
    if (!confirm("Suspender este leilão? Ele será marcado como Cancelado e sumirá do site.")) return;
    try {
      const res = await fetch(`/api/admin/auctions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
      });
      if (res.ok) fetchAuctions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFireAuction = async (id: number) => {
    if (!confirm("O leilão ficará visível publicamente com status Ativo. Prosseguir?")) return;
    try {
      const res = await fetch(`/api/admin/auctions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" })
      });
      if (res.ok) fetchAuctions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja apagar este leilão e todo o seu histórico?")) return;
    try {
      const res = await fetch(`/api/admin/auctions/${id}`, { method: "DELETE" });
      if (res.ok) fetchAuctions();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: '#fef3c7', color: '#b45309' }}><Clock size={12} style={{ display: 'inline', marginBottom: 2 }} /> Rascunho</span>;
      case 'active': return <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)' }}><Rocket size={12} style={{ display: 'inline', marginBottom: 2 }} /> Ao Vivo</span>;
      case 'finished': return <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: '#dcfce7', color: '#166534' }}><CheckCircle size={12} style={{ display: 'inline', marginBottom: 2 }} /> Arrematado</span>;
      case 'cancelled': return <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>Cancelado</span>;
      default: return null;
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Leilões de Centavos</h1>
          <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>Gerencie os produtos sorteados e os pacotes de lances comprados pelos clientes.</p>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ title: "", description: "", retail_value: "", time_increment: "15", end_time: "", min_sale_price: "0", bot_enabled: false, bot_max_price: "0", video_url: "", weight: "", dimensions: "" });
            setImageFile(null);
            setAdditionalImages([]);
            setIsDialogOpen(true);
          }}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={16} /> Cadastrar Prêmio
        </button>
      </div>

      {isDialogOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 650, padding: 0 }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editingId ? "Editar Leilão" : "Novo Leilão"}</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Título do Produto</label>
                  <input className="input" required placeholder="Ex: Action Figure Homem Aranha" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <label className="label">Valor de Mercado (R$)</label>
                  <input className="input" type="number" step="0.01" required placeholder="Ex: 350.00" value={formData.retail_value} onChange={e => setFormData({ ...formData, retail_value: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Descrição do Prêmio</label>
                <textarea className="input" rows={3} placeholder="Descreva o prêmio de forma atrativa..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              {/* Novas Configurações Bot e Valores Mínimos */}
              <div style={{ background: "rgba(99, 102, 241, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <h4 style={{ margin: "0 0 1rem 0", color: "var(--text)" }}>Estratégia Comercial (Preço Base & Bots)</h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Preço Mínimo Venda (Reserva)</label>
                    <input className="input" type="number" step="0.01" value={formData.min_sale_price} onChange={e => setFormData({ ...formData, min_sale_price: e.target.value })} />
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Se o tempo acabar antes de atingir esse número, ninguém leva o produto.</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 700, color: "var(--text)", padding: "1rem 0" }}>
                      <input type="checkbox" checked={formData.bot_enabled} onChange={e => setFormData({ ...formData, bot_enabled: e.target.checked })} style={{ width: 18, height: 18 }} />
                      Ativar Bot (Simulador Fake de Lance)
                    </label>
                  </div>
                </div>

                {formData.bot_enabled && (
                  <div>
                    <label className="label">Valor de Parada do Bot (Limite Máximo)</label>
                    <input className="input" type="number" step="0.01" value={formData.bot_max_price} onChange={e => setFormData({ ...formData, bot_max_price: e.target.value })} />
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Até qual valor os Bots estão autorizados a inflacionarem a disputa?</span>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Data de Fim Agendada (Aproximada)</label>
                  <input className="input" type="datetime-local" required value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
                <div>
                  <label className="label">Incremento/Respiro (Segundos)</label>
                  <select className="input" value={formData.time_increment} onChange={e => setFormData({ ...formData, time_increment: e.target.value })}>
                    <option value="10">10 Segundos</option>
                    <option value="15">15 Segundos</option>
                    <option value="30">30 Segundos</option>
                    <option value="60">1 Minuto</option>
                  </select>
                </div>
              </div>

              {/* Configuração de Apresentação */}
              <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <h4 style={{ margin: "0 0 1rem 0", color: "var(--text)" }}>Especificações Técnicas (Opcional)</h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Peso Completo</label>
                    <input className="input" placeholder="Ex: 1.5kg" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Dimensões / Tamanho</label>
                    <input className="input" placeholder="Ex: 30cm x 15cm x 20cm" value={formData.dimensions} onChange={e => setFormData({ ...formData, dimensions: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="label">Link do Vídeo (Youtube/Tiktok/etc)</label>
                  <input className="input" placeholder="https://" value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} />
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Coloque um link de review ou unboxing se houver.</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Capa Principal (Obrigatório)*</label>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: "0.5rem", border: "1px dashed var(--border)", borderRadius: "6px", background: "var(--surface)" }} />
                </div>
                <div>
                  <label className="label">Galeria Adicional (Múltiplas Fotos)</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => {
                    if (e.target.files) setAdditionalImages(Array.from(e.target.files));
                  }} style={{ width: "100%", padding: "0.5rem", border: "1px dashed var(--border)", borderRadius: "6px", background: "var(--surface)" }} />
                  <span style={{ fontSize: '0.7rem', color: "var(--muted)" }}>Selecione várias {additionalImages.length > 0 && `(${additionalImages.length} selecionadas)`}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setIsDialogOpen(false); setEditingId(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : (editingId ? "Atualizar Leilão" : "Salvar no Rascunho")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Leilões */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              <th style={{ padding: "1rem" }}>Prêmio</th>
              <th style={{ padding: "1rem" }}>Valor Oficial</th>
              <th style={{ padding: "1rem" }}>Status & Bots</th>
              <th style={{ padding: "1rem" }}>Valor Tela</th>
              <th style={{ padding: "1rem" }}>Vencedor</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>Gerenciar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>Carregando radar...</td></tr>
            ) : auctions.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Nenhum leilão cadastrado no sistema.</td></tr>
            ) : (
              auctions.map((a: any) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem", display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {a.image_url ? (
                      <img src={a.image_url} alt={a.title} style={{ width: 45, height: 45, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 45, height: 45, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={20} color="var(--muted)" /></div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={10} /> Respiro: {a.time_increment}s</div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem", color: "var(--muted)", fontWeight: 600 }}>R$ {Number(a.retail_value).toFixed(2)}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ marginBottom: "0.5rem" }}>{getStatusBadge(a.status)}</div>
                    {a.bot_enabled === 1 ? (
                      <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#6366f1", background: "rgba(99, 102, 241, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "999px", display: "inline-block" }}>BOT ON (Max: R${Number(a.bot_max_price).toFixed(2)})</div>
                    ) : (
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--muted)" }}>Bot Off</div>
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ color: "var(--text)", fontWeight: 900, fontSize: "1.1rem" }}>R$ {Number(a.current_price).toFixed(2)}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                      Min: <strong>R$ {Number(a.min_sale_price).toFixed(2)}</strong>
                    </div>
                  </td>
                  <td style={{ padding: "1rem", fontSize: '0.85rem' }}>{a.winner_name || <span style={{ color: 'var(--muted)' }}>-</span>}</td>

                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                      {(a.status === 'pending' || a.status === 'cancelled') && (
                        <button onClick={() => handleFireAuction(a.id)} className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", background: 'var(--accent)', fontSize: '0.75rem' }}>
                          <Rocket size={14} /> {a.status === 'cancelled' ? 'Reativar' : 'Disparar'}
                        </button>
                      )}
                      {(a.status === 'active' || a.status === 'pending') && (
                        <button onClick={() => handleSuspend(a.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#f59e0b", padding: "0.4rem", borderRadius: 6 }} title="Suspender">
                          <PauseCircle size={18} />
                        </button>
                      )}
                      <button onClick={() => handleEdit(a)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--accent)", padding: "0.4rem", borderRadius: 6 }} title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(a.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.4rem", borderRadius: 6 }} title="Apagar Definitivamente"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
