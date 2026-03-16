"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Link from "next/link";

type QuoteCard = {
  id: number;
  title: string;
  status: string;
  client_name?: string;
  client_company?: string;
  printer_name: string;
  print_time_hours: number;
  final_price: number;
  message_count?: number;
  file_url?: string;
  filament_id: number;
  platter_id?: number | null;
  platter_name?: string | null;
  isLotParent?: boolean;
};

const COLUMNS = [
  { id: "quoted", title: "📑 Orçados", color: "#f59e0b" },
  { id: "approved", title: "✅ Aprovados (Fila)", color: "#10b981" },
  { id: "in_production", title: "⚙️ Produzindo", color: "#3b82f6" },
  { id: "delivered", title: "📦 Finalizados", color: "#8b5cf6" },
];

export default function FabricaBoard() {
  const [items, setItems] = useState<QuoteCard[]>([]);
  const [loading, setLoading] = useState(true);
  // React 18 hydration issue prevention for DND
  const [isBrowser, setIsBrowser] = useState(false);

  const [printers, setPrinters] = useState<any[]>([]);
  // Store either a single quoteId or a full platterId string (e.g. "platter-3")
  const [printModal, setPrintModal] = useState<{ quoteId?: number, platterId?: number, destStatus: string, filamentId: number } | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<number>(0);
  const [availableLots, setAvailableLots] = useState<any[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<number>(0);
  const [gcodeFile, setGcodeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Proof of Work modal state
  const [deliveredModal, setDeliveredModal] = useState<{ quoteId?: number, platterId?: number } | null>(null);
  const [resultPhoto, setResultPhoto] = useState<File | null>(null);
  const [showInShowroom, setShowInShowroom] = useState(false);

  // Nesting State
  const [selectedForNesting, setSelectedForNesting] = useState<number[]>([]);
  const [platterName, setPlatterName] = useState("");
  const [showPlatterModal, setShowPlatterModal] = useState(false);

  const fetchKanban = () => {
    fetch("/api/quotes/kanban")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    setIsBrowser(true);
    fetchKanban();
    fetch("/api/printers")
      .then((r) => r.json())
      .then(data => {
        setPrinters(data.filter((p: any) => p.active));
        if (data.length > 0) setSelectedPrinter(data[0].id);
      });
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const isPlatter = draggableId.startsWith("platter-");

    if (isPlatter) {
      const platterIdStr = draggableId.replace("platter-", "");
      const pIdNum = Number(platterIdStr);
      // Get any child filament ID to load lots
      const child = items.find(i => i.platter_id === pIdNum);

      if (newStatus === "in_production") {
        setPrintModal({ platterId: pIdNum, destStatus: newStatus, filamentId: child?.filament_id || 0 });
        if (child?.filament_id) loadLots(child.filament_id);
      } else if (newStatus === "delivered") {
        setDeliveredModal({ platterId: pIdNum });
      } else {
        await executePlatterMove(pIdNum, newStatus);
      }
      return;
    }

    // Normal Quote
    const cardId = Number(draggableId);

    if (newStatus === "in_production") {
      const quote = items.find(i => i.id === cardId);
      setPrintModal({ quoteId: cardId, destStatus: newStatus, filamentId: quote?.filament_id || 0 });
      if (quote?.filament_id) loadLots(quote.filament_id);
      return;
    }

    if (newStatus === "delivered") {
      setDeliveredModal({ quoteId: cardId });
      return;
    }

    await executeMove(cardId, newStatus);
  };

  const loadLots = (filId: number) => {
    fetch(`/api/admin/filaments/lots?filamentId=${filId}&active=1`)
      .then(r => r.json())
      .then(data => {
        setAvailableLots(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedLotId(data[0].id);
        else setSelectedLotId(0);
      });
  };

  // Move Single Quote
  const executeMove = async (cardId: number, newStatus: string, lotId?: number, resultPhotoUrl?: string, showInShowroomFlag?: boolean) => {
    const previousItems = [...items];
    setItems((prev) => prev.map(item => item.id === cardId ? { ...item, status: newStatus } : item));

    try {
      const body: { status: string; filamentLotId?: number; resultPhotoUrl?: string; showInShowroom?: boolean } = {
        status: newStatus,
      };
      if (lotId) body.filamentLotId = lotId;
      if (resultPhotoUrl) body.resultPhotoUrl = resultPhotoUrl;
      if (newStatus === "delivered") body.showInShowroom = showInShowroomFlag;

      const res = await fetch(`/api/quotes/${cardId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
    } catch (e) {
      alert("Erro ao alterar status. Revertendo...");
      setItems(previousItems);
    }
  };

  // Move Platter (updates all child quotes and platter row)
  const executePlatterMove = async (platterId: number, newStatus: string, resultPhotoUrl?: string, showInShowroomFlag?: boolean) => {
    const previousItems = [...items];
    setItems((prev) => prev.map(item => item.platter_id === platterId ? { ...item, status: newStatus } : item));

    try {
      const res = await fetch(`/api/admin/platters/${platterId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          printer_id: selectedPrinter !== 0 ? selectedPrinter : undefined,
          resultPhotoUrl,
          showInShowroom: showInShowroomFlag
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar Lote");
    } catch (e) {
      alert("Erro ao alterar Lote. Revertendo...");
      setItems(previousItems);
    }
  }

  const handlePrintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printModal) return;

    setUploading(true);

    if (printModal.platterId) {
      // We do not support G-Code direct IoT push for Platters yet in this block.
      // It relies purely on marking status & deducting printer hours.
      await executePlatterMove(printModal.platterId, printModal.destStatus);
      setPrintModal(null);
      setUploading(false);
      return;
    }

    if (!printModal.quoteId) return;

    // Single quote logic
    if (!gcodeFile) {
      await executeMove(printModal.quoteId, printModal.destStatus, selectedLotId || undefined);
      setPrintModal(null);
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("quote_id", printModal.quoteId.toString());
      formData.append("printer_id", selectedPrinter.toString());
      formData.append("gcode", gcodeFile);
      if (selectedLotId) formData.append("filament_lot_id", selectedLotId.toString());

      const res = await fetch("/api/admin/print-job", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro no envio do Webhook da impressora.");
      }

      await executeMove(printModal.quoteId, printModal.destStatus);
      setPrintModal(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeliveredSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveredModal) return;

    setUploading(true);
    let finalPhotoUrl = undefined;

    if (resultPhoto) {
      const formData = new FormData();
      formData.append("file", resultPhoto);

      try {
        const upRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const upData = await upRes.json();
        if (upRes.ok && upData.url) {
          finalPhotoUrl = upData.url;
        } else {
          alert("Erro no upload da foto. O status será movido sem ela.");
        }
      } catch (err) {
        alert("Erro no upload da foto.");
      }
    }

    if (deliveredModal.platterId) {
      await executePlatterMove(deliveredModal.platterId, "delivered", finalPhotoUrl, showInShowroom);
    } else if (deliveredModal.quoteId) {
      await executeMove(deliveredModal.quoteId, "delivered", undefined, finalPhotoUrl, showInShowroom);
    }

    setDeliveredModal(null);
    setResultPhoto(null);
    setUploading(false);
  };

  const toggleNestingSelection = (quoteId: number) => {
    setSelectedForNesting(prev => prev.includes(quoteId)
      ? prev.filter(id => id !== quoteId)
      : [...prev, quoteId]
    );
  };

  const createPlatter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedForNesting.length === 0 || !platterName) return;
    setUploading(true);

    try {
      const res = await fetch("/api/admin/platters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: platterName, quoteIds: selectedForNesting })
      });
      if (res.ok) {
        setShowPlatterModal(false);
        setPlatterName("");
        setSelectedForNesting([]);
        fetchKanban(); // Reload to get platter groups
      } else {
        alert("Erro ao criar Lote.");
      }
    } catch (err) {
      alert("Erro interno.");
    } finally {
      setUploading(false);
    }
  }

  // Pre-process items into grouped platters vs singular items
  const renderColumnItems = (status: string) => {
    const colItems = getItemsByStatus(status);
    const rendered: any[] = [];
    const processedPlatters = new Set<number>();

    colItems.forEach((item) => {
      if (!item.platter_id) {
        rendered.push({ ...item, isLotParent: false });
      } else {
        if (!processedPlatters.has(item.platter_id)) {
          processedPlatters.add(item.platter_id);
          const platterChildren = colItems.filter(i => i.platter_id === item.platter_id);
          // Compute aggregate values visually
          const totalHours = platterChildren.reduce((acc, c) => acc + Number(c.print_time_hours || 0), 0);
          const totalPrice = platterChildren.reduce((acc, c) => acc + Number(c.final_price || 0), 0);

          rendered.push({
            id: `platter-${item.platter_id}`,
            platter_id: item.platter_id,
            title: `Lote: ${item.platter_name}`,
            status: item.status,
            printer_name: "Várias/Lote",
            print_time_hours: totalHours,
            final_price: totalPrice,
            client_name: `${platterChildren.length} Peças (Nesting)`,
            isLotParent: true,
            children: platterChildren
          });
        }
      }
    });

    return rendered;
  }

  if (!isBrowser) return null; // Avoid Hydration mismatch with react-beautiful-dnd forks

  if (loading) {
    return <div style={{ color: "var(--muted)", padding: "2rem" }}>Carregando Chão de Fábrica...</div>;
  }

  const getItemsByStatus = (status: string) => (Array.isArray(items) ? items : []).filter(i => i.status === status);

  return (
    <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Fluxo da Fábrica</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Arraste e solte os cartões para atualizar o status e organizar a sua fila de impressão
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {selectedForNesting.length > 0 && (
            <button
              className="btn btn-accent pulse-btn"
              onClick={() => setShowPlatterModal(true)}
              style={{ fontWeight: "bold" }}
            >
              📦 Agrupar Selecionados ({selectedForNesting.length})
            </button>
          )}
          <Link href="/admin/scheduling" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⏱️</span> Fila Produção (Impressão)
          </Link>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: "1rem", flex: 1, overflowX: "auto", overflowY: "hidden", paddingBottom: "1rem" }}>
          {COLUMNS.map(column => (
            <div key={column.id} style={{ display: "flex", flexDirection: "column", minWidth: 320, background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)" }}>
              {/* Column Header */}
              <div style={{ padding: "1rem", borderBottom: `2px solid ${column.color}` }}>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", display: "flex", justifyContent: "space-between" }}>
                  {column.title}
                  <span style={{ fontSize: "0.75rem", background: "var(--surface)", padding: "0.15rem 0.5rem", borderRadius: 999 }}>
                    {getItemsByStatus(column.id).length}
                  </span>
                </h3>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      overflowY: "auto",
                      background: snapshot.isDraggingOver ? "rgba(0,0,0,0.02)" : "transparent",
                      transition: "background 0.2s ease"
                    }}
                  >
                    {renderColumnItems(column.id).map((item, index) => (
                      <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            style={{
                              padding: "1rem",
                              marginBottom: "0.75rem",
                              background: item.isLotParent ? "#f8fafc" : "var(--surface)",
                              borderRadius: 8,
                              border: item.isLotParent ? "2px dashed #94a3b8" : "1px solid var(--border)",
                              boxShadow: dragSnapshot.isDragging ? "0 10px 20px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.02)",
                              opacity: selectedForNesting.includes(item.id as number) ? 0.8 : 1,
                              ...dragProvided.draggableProps.style,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {column.id === 'approved' && !item.isLotParent && (
                                  <input
                                    type="checkbox"
                                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                                    checked={selectedForNesting.includes(item.id as number)}
                                    onChange={() => toggleNestingSelection(item.id as number)}
                                  />
                                )}
                                <span style={{ fontSize: "0.75rem", fontWeight: item.isLotParent ? 800 : 700, color: "var(--muted)" }}>
                                  {item.isLotParent ? `📦 ${item.id}` : `#${item.id}`}
                                </span>
                              </div>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)" }}>
                                {Number(item.final_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            </div>

                            {!item.isLotParent ? (
                              <Link href={`/cotacoes/${item.id}`} style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "0.5rem" }}>
                                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
                                  {item.title || "Sem título"}
                                </h4>
                              </Link>
                            ) : (
                              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.3, marginBottom: "0.5rem" }}>
                                {item.title || "Lote Sem Título"}
                              </h4>
                            )}

                            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                              {item.client_name || item.client_company || "Cliente Avulso"}
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "var(--surface2)", borderRadius: 4, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                🖨️ {item.printer_name}
                              </span>
                              <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "var(--surface2)", borderRadius: 4, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                ⏱️ {Number(item.print_time_hours || 0).toFixed(1)}h
                              </span>
                              {!item.isLotParent && item.message_count > 0 ? (
                                <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#6c63ff22", color: "var(--accent)", border: "1px solid #6c63ff44", borderRadius: 4, display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 700 }}>
                                  💬 {item.message_count}
                                </span>
                              ) : null}
                            </div>

                            {/* Children render for Platters */}
                            {item.isLotParent && (
                              <div style={{ marginTop: "1rem", paddingTop: "0.5rem", borderTop: "1px solid #e2e8f0" }}>
                                {(item.children as QuoteCard[]).map(child => (
                                  <div key={`child-${child.id}`} style={{ fontSize: "0.75rem", display: "flex", justifyContent: "space-between", padding: "0.25rem 0", color: "#64748b" }}>
                                    <span>- #{child.id} {child.title?.substring(0, 20)}...</span>
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Nesting Modal (Create Platter) */}
      {showPlatterModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowPlatterModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">📦 Agrupar em Lote de Mesa</h2>
            <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
              Você selecionou <strong>{selectedForNesting.length} cotações</strong> para agrupar em um único Lote. Ao arrastar este Lote no painel, o status de todas mudará simultaneamente!
            </p>
            <form onSubmit={createPlatter}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="label">Nome da Bandeja / Lote</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Bandeja PETG Preto 01"
                  value={platterName}
                  onChange={(e) => setPlatterName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? "Agrupando..." : "Criar Lote Nesting"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowPlatterModal(false)} disabled={uploading}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Job Modal */}
      {printModal && (
        <div className="modal-overlay" onClick={() => !uploading && setPrintModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Iniciar Produção {printModal.platterId && "(Lote)"}</h2>
            <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
              {printModal.platterId
                ? "Você está movendo um Lote inteiro. Para lotes com múltiplos arquivos STL/G-Code as conexões diretas via Moonraker estão desabilitadas. Prossiga para descontar da impressora correta."
                : "Deseja despachar o arquivo G-Code diretamente para a impressora via rede local?"
              }
            </p>

            <form onSubmit={handlePrintSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Alocar Impressora</label>
                <select className="input" value={selectedPrinter} onChange={(e) => setSelectedPrinter(Number(e.target.value))}>
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.api_type && p.api_type !== 'none' ? `(IoT: ${p.api_type})` : '(Manual)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rolo individual omitido em lote por enquanto para simplificar o MVP de rollback. Poderá ser expandido via Backend. */}
              {!printModal.platterId && (
                <div style={{ marginBottom: "1rem" }}>
                  <label className="label">Vincular Rolo/Lote (Obrigatório p/ Traceability)</label>
                  <select className="input" value={selectedLotId} onChange={(e) => setSelectedLotId(Number(e.target.value))} required>
                    <option value="">Selecione um rolo...</option>
                    {availableLots.map(l => (
                      <option key={l.id} value={l.id}>
                        Rolo: {l.lot_number} ({Number(l.current_weight_g).toFixed(0)}g restantes)
                      </option>
                    ))}
                  </select>
                  {availableLots.length === 0 && (
                    <div style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "0.25rem" }}>
                      ⚠️ Nenhum rolo individual cadastrado para este filamento. Cadastre no estoque primeiro.
                    </div>
                  )}
                </div>
              )}

              {!printModal.platterId && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <label className="label">Arquivo G-Code Fatiado (Opcional)</label>
                  <input
                    className="input"
                    type="file"
                    accept=".gcode,.gco"
                    onChange={(e) => setGcodeFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                    Se anexado, será enviado imediatamente via API para a impressora selecionada (OctoPrint/Moonraker).
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? "📡 Conectando..." : (gcodeFile && !printModal.platterId ? "🚀 Enviar para Impressora" : "Apenas Mover Status")}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setPrintModal(null)} disabled={uploading}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivered Modal (Proof of Work) */}
      {deliveredModal && (
        <div className="modal-overlay" onClick={() => !uploading && setDeliveredModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Finalizar Pedido {deliveredModal.platterId && "(Lote Enteiro)"}</h2>
            <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
              {deliveredModal.platterId
                ? "Upload 1foto da mesa cheia! Essa foto é opcional e será atrelada a TODAS as peças deste lote e enviada para dezenas de clientes automaticamente no WhatsApp."
                : "Upload da foto do resultado (Proof of Work). Opcional, mas encanta o cliente via WhatsApp!"
              }
            </p>

            <form onSubmit={handleDeliveredSubmit}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="label">📸 Foto da Peça Pronta (Opção PNG/JPG)</label>
                <input
                  className="input"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setResultPhoto(e.target.files ? e.target.files[0] : null)}
                />
              </div>

              <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setShowInShowroom(!showInShowroom)}>
                <input
                  type="checkbox"
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  checked={showInShowroom}
                  onChange={() => { }}
                />
                <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>
                  🌟 Exibir na Vitrine Pública (Portfólio)
                </label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? "Salvando..." : "Confirmar Entrega 🎉"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setDeliveredModal(null)} disabled={uploading}>
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
