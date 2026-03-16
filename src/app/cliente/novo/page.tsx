"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import ModelViewer from "@/components/ModelViewer";

type SliceStatus = "idle" | "slicing" | "done" | "error";

type FileItem = {
  id: string;
  file: File | null;
  name: string;
  url: string | null;
  previewUrl?: string;
  material: string;
  color: string;
  infill: number;
  quantity: number;
  time_h?: number;
  weight_g?: number;
  estimated_price?: number; // Real price from backend calculateCosts
  sliceStatus: SliceStatus;
  sliceError?: string;
  lastSliceKey?: string; // "infill|quantity" fingerprint to avoid redundant re-slices
};

// Returns estimated price from slicer output based on business config
function estimatePrice(weight_g: number, time_h: number, cfg: any, quantity = 1, isMulticolor = false): number {
  if (!cfg || !weight_g) return 0;
  const filamentCostPerG = (Number(cfg.filament_cost_per_gram) || 0.12); // fallback R$0.12/g
  const energyPerHour = Number(cfg.energy_kwh_price || 0) * 0.3; // ~300W avg printer
  const laborPerHour = Number(cfg.labor_hourly_rate || 0);

  let marginFactor = 1 + (Number(cfg.default_profit_margin_pct || 30) / 100);
  let lossFactor = 1 + (Number(cfg.default_loss_pct || 5) / 100);

  let finalWeight = weight_g;
  let finalTime = time_h;

  if (isMulticolor && cfg.enable_multicolor) {
    marginFactor += (Number(cfg.multicolor_markup_pct || 0) / 100);
    finalWeight += Number(cfg.multicolor_waste_g || 0);
    finalTime += Number(cfg.multicolor_hours_added || 0);
  }

  const raw = (finalWeight * filamentCostPerG + finalTime * (energyPerHour + laborPerHour)) * lossFactor * marginFactor;
  return Math.max(raw * quantity, 1);
}

export default function NewQuoteRequestPage() {
  const router = useRouter();
  const [items, setItems] = useState<FileItem[]>([]);
  const { data: session, status } = useSession();
  const [openPreviews, setOpenPreviews] = useState<string[]>([]);
  const [filaments, setFilaments] = useState<any[]>([]);

  const [notes, setNotes] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMulticolor, setIsMulticolor] = useState(false);
  const [selectedUpsells, setSelectedUpsells] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<any>(null);

  // Dimension scaling states
  const [modelMetrics, setModelMetrics] = useState<Record<string, { x: number; y: number; z: number }>>({});
  const [modelScales, setModelScales] = useState<Record<string, number>>({});

  // Debounce timers per item id
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  // Check for catalog item or parametric item in URL/LocalStorage
  useEffect(() => {
    async function initPendingItems() {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const catId = params.get("catalog_id");
      const catUrl = params.get("stl_url");
      const catName = params.get("name");

      const pendingParametricStl = localStorage.getItem("pending_parametric_stl");
      const pendingParametricTitle = localStorage.getItem("pending_parametric_title");

      let urlToFetch = pendingParametricStl || catUrl;
      let nameToUse = pendingParametricTitle || catName || "Modelo Customizado";
      let idPrefix = pendingParametricStl ? "param" : "cat";
      let modelId = pendingParametricStl ? Date.now() : catId;

      if (urlToFetch) {
        try {
          // Fetch the Actual File from the URL (Parametric or Catalog)
          // This allows the auto-slicer to act as if it's a locally uploaded file
          const response = await fetch(urlToFetch);
          const blob = await response.blob();
          const file = new File([blob], nameToUse.endsWith(".stl") ? nameToUse : `${nameToUse}.stl`, { type: "model/stl" });

          const itemId = `${idPrefix}_${modelId}`;
          setItems([{
            id: itemId,
            file: file,
            name: nameToUse,
            url: urlToFetch,
            previewUrl: urlToFetch,
            material: "PLA",
            color: "",
            infill: 20,
            quantity: 1,
            sliceStatus: "idle",
          }]);
          setOpenPreviews([itemId]);

          if (pendingParametricStl) {
            localStorage.removeItem("pending_parametric_stl");
            localStorage.removeItem("pending_parametric_title");
          }
        } catch (e) {
          console.error("Erro ao carregar arquivo STL pendente:", e);
        }
      }
    }

    initPendingItems();
  }, [router]);

  // Fetch filaments
  useEffect(() => {
    fetch("/api/filaments")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter only those with weight > 0
          const available = data.filter(f => Number(f.current_weight_g) > 0);
          setFilaments(available);

          // Optionally update existing un-customized items to the best PLA if they just loaded
          if (items.length > 0 && available.length > 0) {
            const bestPla = available.filter(f => f.type === "PLA").sort((a, b) => Number(b.current_weight_g) - Number(a.current_weight_g))[0];
            if (bestPla) {
              setItems(prev => prev.map(it => {
                if (it.material === "PLA" && it.color === "") {
                  return { ...it, material: bestPla.type, color: bestPla.color };
                }
                return it;
              }));
            }
          }
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-slice a single item by ID
  const autoSliceItem = useCallback(async (itemId: string, infill: number, quantity: number, scale: number) => {
    const sliceKey = `${infill}|${quantity}|${scale}`;

    setItems(prev => prev.map(it =>
      it.id === itemId ? { ...it, sliceStatus: "slicing" as SliceStatus } : it
    ));

    // Read the latest file from the current items state
    let targetItem: FileItem | undefined;
    setItems(prev => {
      targetItem = prev.find(it => it.id === itemId);
      return prev;
    });

    // Wait a tick for targetItem to be set
    await new Promise(r => setTimeout(r, 0));

    // Use a ref-safe approach: just read from state directly via callback
    let currentFile: File | null = null;
    setItems(prev => {
      const found = prev.find(it => it.id === itemId);
      if (found) currentFile = found.file;
      return prev;
    });

    // Give React time to flush
    await new Promise(r => setTimeout(r, 10));

    if (!currentFile) {
      // Catalog item — can't slice client-side (no raw File object)
      setItems(prev => prev.map(it =>
        it.id === itemId ? { ...it, sliceStatus: "idle" as SliceStatus, lastSliceKey: sliceKey } : it
      ));
      return;
    }

    try {
      const validFile = currentFile as File;
      if (!validFile || !validFile.name) throw new Error("Ficheiro inválido ou não carregado");

      // Read material from the item so API can pick the right filament pricing
      let itemMaterial = "PLA";
      setItems(prev => {
        const found = prev.find(it => it.id === itemId);
        if (found) itemMaterial = found.material || "PLA";
        return prev;
      });
      await new Promise(r => setTimeout(r, 0));

      const formData = new FormData();
      formData.append("infill", String(infill));
      formData.append("quantities", JSON.stringify({ [validFile.name]: quantity }));
      formData.append("scales", JSON.stringify({ [validFile.name]: scale / 100 }));
      formData.append("material", itemMaterial);

      formData.append("files", validFile, validFile.name);

      const res = await fetch("/api/slice", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro no fatiamento");

      setItems(prev => prev.map(it =>
        it.id === itemId
          ? {
            ...it,
            sliceStatus: "done" as SliceStatus,
            time_h: data.print_time_hours,
            weight_g: data.weight_g,
            estimated_price: data.estimated_price ?? undefined,
            lastSliceKey: sliceKey,
            sliceError: undefined
          }
          : it
      ));
    } catch (err: any) {
      setItems(prev => prev.map(it =>
        it.id === itemId
          ? { ...it, sliceStatus: "error" as SliceStatus, sliceError: err.message, lastSliceKey: sliceKey }
          : it
      ));
    }
  }, []);

  // Watch items for infill/quantity changes → trigger debounced auto-slice
  useEffect(() => {
    items.forEach(item => {
      if (!item.file) return; // catalog items skip
      const currentScale = modelScales[item.name] || 100;
      const sliceKey = `${item.infill}|${item.quantity}|${currentScale}`;
      if (item.lastSliceKey === sliceKey && item.sliceStatus !== "idle") return; // no change
      if (item.sliceStatus === "slicing") return; // already in progress

      // Clear previous timer for this item
      if (debounceTimers.current[item.id]) {
        clearTimeout(debounceTimers.current[item.id]);
      }

      // Set new debounced timer (1.2s)
      debounceTimers.current[item.id] = setTimeout(() => {
        const itemScale = modelScales[item.name] || 100;
        autoSliceItem(item.id, item.infill, item.quantity, itemScale);
      }, 1200);
    });

    // Cleanup
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(i => `${i.id}:${i.infill}:${i.quantity}`).join(","), modelScales]);

  const handleFileDrop = (newFiles: File[]) => {
    // Find best PLA default
    let defaultMat = "PLA";
    let defaultCol = "";
    if (filaments.length > 0) {
      const bestPla = filaments.filter(f => f.type === "PLA").sort((a, b) => Number(b.current_weight_g) - Number(a.current_weight_g))[0];
      if (bestPla) {
        defaultMat = bestPla.type;
        defaultCol = bestPla.color;
      }
    }

    const newItems: FileItem[] = newFiles
      .filter(f => {
        const n = f.name.toLowerCase();
        return n.endsWith('.stl') || n.endsWith('.obj') || n.endsWith('.3mf') || n.endsWith('.zip');
      })
      .map(f => {
        const is3D = !f.name.toLowerCase().endsWith('.zip');
        return {
          id: Math.random().toString(36).substring(7),
          file: f,
          name: f.name,
          url: null,
          previewUrl: is3D ? URL.createObjectURL(f) : undefined,
          material: defaultMat,
          color: defaultCol,
          infill: 20,
          quantity: 1,
          sliceStatus: "idle" as SliceStatus,
        };
      });

    const newScales = { ...modelScales };
    newItems.forEach(it => {
      if (!newScales[it.name]) newScales[it.name] = 100;
    });
    setModelScales(newScales);

    setItems(prev => [...prev, ...newItems]);

    if (newItems.length > 0) {
      const idsToOpen = newItems.filter(i => i.previewUrl).map(i => i.id);
      if (idsToOpen.length > 0) {
        setOpenPreviews(prev => [...prev, ...idsToOpen]);
      }
    }
  };

  const updateItem = (id: string, updates: Partial<FileItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
    setItems(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove) {
        // Clean up metrics and scales
        setModelMetrics(m => {
          const nm = { ...m };
          delete nm[itemToRemove.url || itemToRemove.name];
          return nm;
        });
        setModelScales(s => {
          const ns = { ...s };
          delete ns[itemToRemove.url || itemToRemove.name];
          return ns;
        });
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent, submitAction: "review" | "approve") => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Por favor, selecione ou arraste seus arquivos 3D.");
      return;
    }

    if (status === "unauthenticated") {
      setError("Por favor, faça login (Entrar com Google) ou cadastre-se para poder salvar esta cotação na sua conta e enviá-la para nossa fábrica.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setError("");
    setProgress(10);

    try {
      const payloadItems = [];
      const increment = 50 / Math.max(1, items.length);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let file_url = item.url;

        if (item.file) {
          const formData = new FormData();
          formData.append("file", item.file);

          const upRes = await fetch("/api/upload", { method: "POST", body: formData });
          const upData = await upRes.json();

          if (!upRes.ok) throw new Error(upData.error || `Erro no upload de ${item.name}`);
          file_url = upData.url;
        }

        const estimatedPrice = estimatePrice(item.weight_g || 0, item.time_h || 0, config, item.quantity, isMulticolor);

        payloadItems.push({
          file_url: file_url,
          name: item.name,
          material: item.material,
          color: item.color,
          infill: Number(item.infill),
          quantity: Number(item.quantity),
          scale_pct: modelScales[item.name] || 100,
          is_multicolor: isMulticolor,
          weight_g: item.weight_g,
          time_h: item.time_h,
          estimated_price: estimatedPrice
        });

        setProgress(10 + (i + 1) * increment);
      }

      setProgress(70);

      // Submit Quote to API
      const reqRes = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle || "Cotação Customizada",
          notes: notes,
          items: payloadItems,
          upsells: selectedUpsells,
          action: submitAction
        })
      });

      const resData = await reqRes.json();
      if (!reqRes.ok) {
        throw new Error(resData.error || "Falha ao gerar cotação");
      }

      setProgress(100);

      if (submitAction === "review") {
        router.push("/cliente?success=review_requested");
      } else {
        // Se API gerou token direto (como no instant quoting), envia para o portal de checkout/aprovação
        if (resData.quote_token) {
          router.push(`/portal/${resData.quote_token}`);
        } else {
          router.push("/cliente?success=quoted");
        }
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setProgress(0);
    }
  };

  const isCatalog = items.length === 1 && !items[0].file;
  // Use estimated_price from backend (calculateCosts) when available; fallback to local formula
  const totalEstimate = items.reduce((acc, it) => {
    if (it.estimated_price != null) return acc + it.estimated_price;
    return acc + estimatePrice(it.weight_g || 0, it.time_h || 0, config, it.quantity, isMulticolor);
  }, 0);
  const allSliced = items.length > 0 && items.every(it => !it.file || it.sliceStatus === "done" || it.sliceStatus === "error");
  const anySlicing = items.some(it => it.sliceStatus === "slicing");

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: config?.currency_code || "BRL" });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/cliente" className="btn btn-ghost" style={{ padding: "0.5rem 1rem" }}>
          ← Voltar
        </Link>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Montagem de Cotação</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Faça upload do(s) seu(s) modelo(s) e ajuste as configurações. O orçamento é calculado automaticamente.
          </p>
        </div>
      </div>

      {status === "unauthenticated" && (
        <div style={{ padding: "1.5rem", borderRadius: "12px", background: "var(--surface)", border: "1px dashed #4285F4", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: "0 0 0.25rem", color: "var(--text)", fontWeight: 800 }}>Identificação Necessária</h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
              Para gerar orçamentos formais e enviá-los à nossa fábrica, você precisa estar logado na sua conta. Entre com o Google rapidamente.
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); signIn("google", { callbackUrl: window.location.href }); }}
            className="btn"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "white", color: "#333", border: "1px solid #ddd", fontWeight: 600 }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
            Entrar com Google
          </button>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>

        {!isCatalog && (
          <div
            style={{
              border: "2px dashed var(--accent)",
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
              marginBottom: "2rem",
              background: "rgba(108, 99, 255, 0.03)",
              transition: "all 0.2s ease"
            }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation();
              if (e.dataTransfer.files) {
                handleFileDrop(Array.from(e.dataTransfer.files));
              }
            }}
          >
            <input
              type="file"
              accept=".stl,.obj,.3mf,.zip"
              multiple
              onChange={e => {
                if (e.target.files) handleFileDrop(Array.from(e.target.files));
              }}
              style={{ display: "none" }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: "pointer", display: "block" }}>
              <div style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>📤</div>
              <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-color)" }}>
                Clique aqui ou arraste seus arquivos 3D (STL, OBJ, 3MF)
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.4rem" }}>
                O orçamento é calculado automaticamente após o upload ✨
              </div>
            </label>
          </div>
        )}

        {!isCatalog && (
          <Link href="/cliente/orcamento-manual" style={{ textDecoration: "none", display: "block", marginBottom: "2rem" }}>
            <div style={{
              padding: "1.25rem 1.5rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(255,165,0,0.08), rgba(255,101,132,0.06))",
              border: "1.5px dashed #f59e0b",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ fontSize: "2rem" }}>📝</div>
                <div>
                  <div style={{ fontWeight: 800, color: "#b45309", fontSize: "0.95rem" }}>Não tem o arquivo 3D?</div>
                  <div style={{ fontSize: "0.825rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                    Descreva o que precisa e envie fotos de referência — nossa equipe prepara um orçamento personalizado para você.
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "1.2rem", color: "#f59e0b", fontWeight: 700, whiteSpace: "nowrap" }}>→</div>
            </div>
          </Link>
        )}

        {items.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>📦</span> Meus Arquivos ({items.length})
              </h3>
              {anySlicing && (
                <span style={{ fontSize: "0.8rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                  Calculando automaticamente...
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {items.map((item) => {
                // Prefer backend-calculated price (calculateCosts); fallback to local formula
                const estimatedItemPrice = item.estimated_price != null
                  ? item.estimated_price
                  : estimatePrice(item.weight_g || 0, item.time_h || 0, config, item.quantity, isMulticolor);
                const fileIdentifier = item.url || item.name;
                const metrics = modelMetrics[fileIdentifier];
                const scale = modelScales[item.name] || 100;

                return (
                  <div key={item.id} className="card" style={{ padding: "1.5rem", position: "relative", borderLeft: `4px solid ${item.sliceStatus === "done" ? "#22c55e" : item.sliceStatus === "error" ? "#ef4444" : item.sliceStatus === "slicing" ? "#f59e0b" : "var(--accent)"}`, transition: "border-color 0.3s" }}>
                    {!isCatalog && (
                      <button type="button" onClick={() => removeItem(item.id)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Remover</button>
                    )}

                    {/* Slice Status Badge */}
                    <div style={{ position: "absolute", top: "1rem", right: isCatalog ? "1rem" : "5.5rem" }}>
                      {item.sliceStatus === "slicing" && (
                        <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "0.2rem 0.7rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          ⏳ Calculando...
                        </span>
                      )}
                      {item.sliceStatus === "done" && item.weight_g && (
                        <span style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", padding: "0.2rem 0.7rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          ✅ {item.time_h?.toFixed(1)}h · {item.weight_g?.toFixed(0)}g · ~{fmt(estimatedItemPrice)}
                        </span>
                      )}
                      {item.sliceStatus === "error" && (
                        <span title={item.sliceError} style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", padding: "0.2rem 0.7rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, cursor: "help" }}>
                          ⚠️ Estimativa indisponível
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", cursor: "pointer" }} onClick={() => {
                      setOpenPreviews(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                    }}>
                      <div style={{ width: 40, height: 40, background: "var(--surface2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                        {item.name.toLowerCase().endsWith('.zip') ? '🗂️' : '🧊'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Clique para {openPreviews.includes(item.id) ? 'ocultar' : 'ver'} prévia 3D</div>
                      </div>
                    </div>

                    {openPreviews.includes(item.id) && item.previewUrl && (
                      <div style={{ paddingBottom: "1.5rem" }}>
                        <div style={{ height: 300, marginBottom: "0.5rem", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", position: "relative" }}>
                          <button type="button" onClick={() => setOpenPreviews(prev => prev.filter(id => id !== item.id))} style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 10, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem" }}>Fechar Visualizador</button>
                          <ModelViewer
                            key={`${item.id}-${isMulticolor}`}
                            url={item.previewUrl}
                            filename={item.name}
                            color={'#6c63ff'}
                            materialType={item.material}
                            forceMulticolor={isMulticolor}
                            onDimensionsCalculated={(dims) => {
                              setModelMetrics(prev => ({
                                ...prev,
                                [fileIdentifier]: dims
                              }));
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", background: "var(--surface2)", padding: "1rem", borderRadius: "8px", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: "150px" }}>
                            <label className="label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>Fator de Escala (%)</label>
                            <input
                              type="number"
                              className="input"
                              style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem" }}
                              min="1"
                              max="10000"
                              value={scale}
                              onChange={(e) => {
                                let val = parseInt(e.target.value);
                                if (isNaN(val)) val = 100;
                                setModelScales(prev => ({ ...prev, [item.name]: val }));
                                // Slicer depends on scale, so mark as idle to trigger re-slice
                                updateItem(item.id, { sliceStatus: "idle" as SliceStatus });
                              }}
                            />
                          </div>

                          {metrics ? (
                            <div style={{ flex: 2, display: "flex", gap: "1.5rem" }}>
                              <div>
                                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>LARGURA (X)</div>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--accent)" }}>{((metrics.x * scale) / 100).toFixed(1)} mm</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>PROFUNDIDADE (Y)</div>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--accent)" }}>{((metrics.y * scale) / 100).toFixed(1)} mm</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>ALTURA (Z)</div>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--accent)" }}>{((metrics.z * scale) / 100).toFixed(1)} mm</div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                              Calculando medidas originais...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                      <div>
                        <label className="label" style={{ fontSize: "0.8rem" }}>Matéria Prima / Cor</label>
                        <select
                          className="input"
                          style={{ padding: "0.5rem", fontSize: "0.85rem" }}
                          value={`${item.material}|${item.color}`}
                          onChange={(e) => {
                            const [mat, col] = e.target.value.split('|');
                            // Material change only: no re-slice needed, just UI update
                            updateItem(item.id, { material: mat, color: col });
                          }}
                        >
                          <option value="Qualquer|">Deixar recomendarem o melhor</option>
                          {filaments.map(f => (
                            <option key={f.id} value={`${f.type}|${f.color}`}>
                              {f.type} - {f.color} ({f.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: "0.8rem" }}>
                          Infill (%)
                          <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: "0.4rem", fontSize: "0.7rem" }}>↻ auto-calcula</span>
                        </label>
                        <input
                          type="number"
                          className="input"
                          style={{ padding: "0.5rem", fontSize: "0.85rem" }}
                          min="0" max="99"
                          value={item.infill}
                          onChange={(e) => updateItem(item.id, { infill: Math.min(99, parseInt(e.target.value) || 20), sliceStatus: "idle" as SliceStatus })}
                        />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: "0.8rem" }}>
                          Quantidade
                          <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: "0.4rem", fontSize: "0.7rem" }}>↻ auto-calcula</span>
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { quantity: Math.max(1, (item.quantity || 1) - 1), sliceStatus: "idle" as SliceStatus })}
                            style={{ width: "2rem", height: "2.1rem", border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: "var(--text)", fontWeight: "bold" }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="input"
                            style={{ padding: "0.5rem", fontSize: "0.85rem", width: "4rem", textAlign: "center" }}
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1, sliceStatus: "idle" as SliceStatus })}
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { quantity: (item.quantity || 1) + 1, sliceStatus: "idle" as SliceStatus })}
                            style={{ width: "2rem", height: "2.1rem", border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: "var(--text)", fontWeight: "bold" }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Estimate Bar */}
            {allSliced && totalEstimate > 0 && (
              <div style={{ marginTop: "1rem", padding: "1rem 1.5rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Estimativa total do projeto</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#22c55e" }}>{fmt(totalEstimate)}</div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "right" }}>
                  Valor final pode variar conforme análise técnica.<br />
                  Atualizado automaticamente ✨
                </div>
              </div>
            )}
          </div>
        )}

        {config?.enable_multicolor && items.length > 0 && (
          <div style={{ marginBottom: "1.5rem", padding: "1.5rem", background: isMulticolor ? "rgba(255, 101, 132, 0.05)" : "var(--surface)", borderRadius: 12, border: isMulticolor ? "1px solid var(--accent)" : "1px dashed var(--border)", transition: "all 0.2s ease" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "1rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                style={{ width: "1.25rem", height: "1.25rem", marginTop: 2, accentColor: "var(--accent)" }}
                checked={isMulticolor}
                onChange={(e) => setIsMulticolor(e.target.checked)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent)" }}>🎨 Impressão Multi-colorida (AMS/MMU)</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-color)", marginTop: "0.25rem" }}>
                  Habilite se o seu 3D exige trocas automáticas de filamento durante a impressão para ficar colorido.
                </div>
                {isMulticolor && (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem", background: "var(--surface2)", padding: "0.5rem", borderRadius: "8px" }}>
                    ⚠️ <b>Aviso:</b> Impressões Multi-coloridas possuem acréscimo de valor devido ao desperdício (Torre de Purga) e tempo adicional das trocas contínuas de bico.
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <label className="label">Identificação / Nome do Projeto</label>
            <input type="text" className="input" placeholder="Ex: Robô de Combate v2" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
            <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.25rem" }}>Facilita localizar este pedido futuramente.</p>
          </div>
          <div>
            <label className="label">Observações Gerais do Pedido</label>
            <input type="text" className="input" placeholder="Exigências de tolerância dimensional, acabamento, suportes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {error && (
          <div style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1.5rem", padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        {loading && progress > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
              <span>Enviando dados e calculando assembly...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: "6px", background: "var(--bg-main)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", transition: "width 0.3s" }}></div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, "review")}
            className="btn"
            style={{ flex: 1, padding: "1rem", fontSize: "1rem", justifyContent: "center", background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
            disabled={loading || anySlicing || !allSliced || totalEstimate === 0}
          >
            {loading ? "Processando..." : anySlicing ? "⏳ Calculando..." : "Escalar para o Time Técnico (Avaliação manual)"}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, "approve")}
            className="btn btn-primary"
            style={{ flex: 2, padding: "1rem", fontSize: "1.1rem", justifyContent: "center" }}
            disabled={loading || anySlicing || !allSliced || totalEstimate === 0}
          >
            {loading ? "Gerando Pedido..." : anySlicing ? "⏳ Calculando..." : allSliced && totalEstimate > 0 ? `Ir para Pagamento da Cotação · ~${fmt(totalEstimate)}` : "Aprovar Cotação"}
          </button>
        </div>

        {items.some(i => i.file) && (
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted)", marginTop: "1rem" }}>
            ✨ O orçamento é recalculado automaticamente ao mudar infill ou quantidade. Se tiver dúvidas complexas no arquivo, escolha 'Escalar para o Time Técnico'.
          </p>
        )}
      </form>
    </div>
  );
}
