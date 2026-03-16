"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import ModelViewer from "@/components/ModelViewer";

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
};

export default function NewQuoteRequestPage() {
  const router = useRouter();
  const [items, setItems] = useState<FileItem[]>([]);
  const { data: session, status } = useSession();
  const [openPreviews, setOpenPreviews] = useState<string[]>([]);
  const [filaments, setFilaments] = useState<any[]>([]);

  const [notes, setNotes] = useState("");
  const [projectTitle, setProjectTitle] = useState("");

  // Endereço de Envio
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComp, setAddressComp] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');

  const handleZipcodeBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setStateCode(data.uf || "");
      }
    } catch (e) { console.error("ViaCEP Err:", e) }
  };

  // Coupons
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null);
  const [couponMsg, setCouponMsg] = useState({ text: "", type: "" });
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isSlicing, setIsSlicing] = useState(false);

  // VIP Client Info
  const [clientInfo, setClientInfo] = useState<any>(null);

  useEffect(() => {
    fetch("/api/client/me")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setClientInfo(data);
          // Pre-populate form fields
          if (data.name) setClientName(data.name);
          if (data.document) setDocumentNumber(data.document);
          if (data.zipcode) setZipcode(data.zipcode);
          if (data.address) setAddress(data.address);
          if (data.address_number) setAddressNumber(data.address_number);
          if (data.address_comp) setAddressComp(data.address_comp);
          if (data.neighborhood) setNeighborhood(data.neighborhood);
          if (data.city) setCity(data.city);
          if (data.state) setStateCode(data.state);
        }
      })
      .catch(console.error);
  }, []);

  const [isMulticolor, setIsMulticolor] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(data => {
        setConfig(data);
      })
      .catch(console.error);
  }, []);

  // Upsells
  const [availableUpsells, setAvailableUpsells] = useState<any[]>([]);
  const [selectedUpsells, setSelectedUpsells] = useState<number[]>([]);

  // Fetch upsells on mount
  useEffect(() => {
    fetch("/api/upsells")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableUpsells(data.filter((u: any) => u.active));
        }
      })
      .catch(console.error);
  }, []);

  // Check for catalog item in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catId = params.get("catalog_id");
      const url = params.get("stl_url");
      const name = params.get("name");

      if (catId && url && name) {
        setItems([{
          id: `cat_${catId}`,
          file: null,
          name: name,
          url: url,
          previewUrl: url,
          material: "PLA",
          color: "",
          infill: 20,
          quantity: 1
        }]);
        setOpenPreviews([`cat_${catId}`]);
      }
    }
  }, []);

  // Fetch filaments
  useEffect(() => {
    fetch("/api/filaments")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter only those with weight > 0
          setFilaments(data.filter(f => Number(f.current_weight_g) > 0));
        }
      })
      .catch(console.error);
  }, []);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponMsg({ text: "", type: "" });
    try {
      const res = await fetch("/api/cupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cupom inválido");
      setCouponData(data);
      setCouponMsg({ text: "Cupom aplicado com sucesso!", type: "success" });
    } catch (err: any) {
      setCouponData(null);
      setCouponMsg({ text: err.message, type: "error" });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleFileDrop = (newFiles: File[]) => {
    const newItems: FileItem[] = newFiles.filter(f => f.name.toLowerCase().endsWith('.stl') || f.name.toLowerCase().endsWith('.obj') || f.name.toLowerCase().endsWith('.3mf') || f.name.toLowerCase().endsWith('.zip')).map(f => {
      const is3D = f.name.toLowerCase().endsWith('.stl') || f.name.toLowerCase().endsWith('.obj') || f.name.toLowerCase().endsWith('.3mf');
      return {
        id: Math.random().toString(36).substring(7),
        file: f,
        name: f.name,
        url: null,
        previewUrl: is3D ? URL.createObjectURL(f) : undefined,
        material: "PLA",
        color: "",
        infill: 20,
        quantity: 1
      };
    });
    setItems(prev => [...prev, ...newItems]);

    // Ocultar automaticamente outras prévias se forem muitos itens para não travar a memória (WebGL limite)
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
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAutoSlice = async () => {
    if (items.length === 0) return;
    setIsSlicing(true);

    try {
      const formData = new FormData();
      formData.append("infill", "20");
      let attachedCount = 0;

      for (const item of items) {
        if (item.file) {
          formData.append("files", item.file, item.name);
          attachedCount++;
        }
      }

      if (attachedCount === 0) {
        alert("Apenas arquivos locais podem ser fatiados antes do envio.");
        setIsSlicing(false);
        return;
      }

      const res = await fetch("/api/slice", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro no fatiamento");

      // Update the FIRST item or distribute evenly for display
      setItems(prev => prev.map((it, idx) => idx === 0 ? {
        ...it,
        time_h: data.print_time_hours,
        weight_g: data.weight_g
      } : it));

      alert(`Fatiamento Concluído!\nTempo Total: ${data.print_time_hours}h\nPeso Total: ${data.weight_g}g`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro no fatiamento");
    } finally {
      setIsSlicing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Por favor, selecione ou arraste seus arquivos 3D.");
      return;
    }
    if (deliveryMethod === 'shipping' && (!zipcode || zipcode.replace(/\D/g, "").length < 8)) {
      setError("Por favor, digite um CEP válido com 8 dígitos.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(10); // Iniciando

    try {
      // 1. Upload files where necessary and collect valid payload
      const payloadItems = [];
      const increment = 50 / Math.max(1, items.length);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let file_url = item.url;

        if (item.file) {
          const formData = new FormData();
          formData.append("file", item.file);

          const upRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const upData = await upRes.json();

          if (!upRes.ok) throw new Error(upData.error || `Erro no upload de ${item.name}`);
          file_url = upData.url;
        }

        payloadItems.push({
          file_url,
          name: item.name,
          material: item.material,
          color: item.color,
          infill: Number(item.infill),
          quantity: Number(item.quantity)
        });

        setProgress(10 + (i + 1) * increment);
      }

      setProgress(60); // Upload finalizado, enviando dados do formulário

      // 2. Criar a Solicitação via Web-to-Print API com Multi-Parts support (Phase 52)
      const reqRes = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle,
          items: payloadItems,
          notes,
          client_zipcode: deliveryMethod === 'pickup' ? (config?.company_zipcode || "") : zipcode.replace(/\D/g, ""),
          client_address: deliveryMethod === 'pickup' ? (config?.company_address || "") : address,
          client_address_number: deliveryMethod === 'pickup' ? "" : addressNumber,
          client_address_comp: deliveryMethod === 'pickup' ? "" : addressComp,
          client_neighborhood: deliveryMethod === 'pickup' ? "" : neighborhood,
          client_city: deliveryMethod === 'pickup' ? (config?.company_city || "") : city,
          client_state: deliveryMethod === 'pickup' ? (config?.company_state || "") : stateCode,
          client_document: documentNumber,
          client_name: clientName,
          coupon_code: couponData ? couponCode : null,
          upsells: selectedUpsells,
          is_multicolor: isMulticolor,
          delivery_method: deliveryMethod
        })
      });

      const reqData = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqData.error || "Erro ao gerar solicitação");

      setProgress(100);
      if (reqData.quote_token) {
        router.push(`/portal/${reqData.quote_token}`);
      } else {
        router.push("/cliente");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setProgress(0);
    }
  };

  const isCatalog = items.length === 1 && !items[0].file;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/cliente" className="btn btn-ghost" style={{ padding: "0.5rem 1rem" }}>
          ← Voltar
        </Link>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Montagem de Cotação</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Nos envie suas peças e configure o material individualmente para cada uma.
          </p>
        </div>
      </div>

      {status === "unauthenticated" && (
        <div style={{ padding: "1.5rem", borderRadius: "12px", background: "var(--surface)", border: "1px dashed #4285F4", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: "0 0 0.25rem", color: "var(--text)", fontWeight: 800 }}>Deseja um Checkout mais Rápido?</h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
              Entre com sua conta Google para evitar preencher seus dados de contato.
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

      {clientInfo && clientInfo.discount_margin_pct > 0 && (
        <div style={{ padding: "1.5rem", borderRadius: "12px", background: "linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(255, 101, 132, 0.1))", border: "1px solid var(--accent)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "2.5rem" }}>👑</div>
          <div>
            <h3 style={{ margin: "0 0 0.25rem", color: "var(--accent)", fontWeight: 800 }}>Você é um Cliente VIP!</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text)" }}>
              Como parceiro B2B, um Desconto Especial de <strong>{Number(clientInfo.discount_margin_pct).toFixed(0)}%</strong> é aplicado automaticamente na base da margem de lucro.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>

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
                Clique aqui ou arraste novos arquivos STLs
              </div>
            </label>
          </div>
        )}

        {items.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>📦</span> Meus Arquivos ({items.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {items.map((item, index) => (
                <div key={item.id} className="card" style={{ padding: "1.5rem", position: "relative", borderLeft: "4px solid var(--accent)" }}>
                  {!isCatalog && (
                    <button type="button" onClick={() => removeItem(item.id)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Remover</button>
                  )}

                  {item.time_h && item.weight_g && (
                    <div style={{ position: "absolute", top: "1rem", right: "6rem", background: "var(--surface2)", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)" }}>
                      ⏱️ {item.time_h}h | ⚖️ {item.weight_g}g
                    </div>
                  )}

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
                    <div style={{ height: 300, marginBottom: "1.5rem", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", position: "relative" }}>
                      <button type="button" onClick={() => setOpenPreviews(prev => prev.filter(id => id !== item.id))} style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 10, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem" }}>Fechar Visualizador</button>
                      <ModelViewer
                        key={`${item.id}-${isMulticolor}`}
                        url={item.previewUrl}
                        filename={item.name}
                        color={'#6c63ff'}
                        materialType={item.material}
                        forceMulticolor={isMulticolor}
                      />
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
                      <label className="label" style={{ fontSize: "0.8rem" }}>Infill (%)</label>
                      <input type="number" className="input" style={{ padding: "0.5rem", fontSize: "0.85rem" }} min="0" max="100" value={item.infill} onChange={(e) => updateItem(item.id, { infill: parseInt(e.target.value) || 20 })} />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: "0.8rem" }}>Quantidade</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
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
                          onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        />
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { quantity: (item.quantity || 1) + 1 })}
                          style={{ width: "2rem", height: "2.1rem", border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: "var(--text)", fontWeight: "bold" }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1rem", textAlign: "right" }}>
              <button
                type="button"
                onClick={handleAutoSlice}
                className="btn btn-ghost"
                style={{ fontSize: "0.85rem", border: "1px solid var(--accent)", color: "var(--accent)" }}
                disabled={isSlicing}
              >
                {isSlicing ? "⏳ Fatiando Bandeja..." : "🔮 Estimar Tempo e Material"}
              </button>
            </div>
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


        {availableUpsells.length > 0 && (
          <div style={{ marginBottom: "1.5rem", padding: "1.5rem", background: "var(--surface)", borderRadius: 12, border: "1px dashed var(--accent)" }}>
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent)" }}>✨ Serviços Premium (Escopo Global)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {availableUpsells.map(u => (
                <label key={u.id} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", cursor: "pointer", padding: "0.75rem", borderRadius: 8, background: selectedUpsells.includes(u.id) ? "rgba(59, 130, 246, 0.05)" : "transparent", border: selectedUpsells.includes(u.id) ? "1px solid var(--accent)" : "1px solid transparent", transition: "all 0.2s ease" }}>
                  <input
                    type="checkbox"
                    style={{ width: "1.25rem", height: "1.25rem", marginTop: 2, accentColor: "var(--accent)" }}
                    checked={selectedUpsells.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedUpsells(prev => [...prev, u.id]);
                      else setSelectedUpsells(prev => prev.filter(id => id !== u.id));
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700 }}>{u.name}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-color)", background: "var(--surface2)", padding: "0.15rem 0.5rem", borderRadius: 999 }}>
                        {u.charge_type === 'fixed' ? `+ R$ ${Number(u.charge_value).toFixed(2)}` : `+ ${u.charge_value}h`}
                        {u.per_unit && " /peça"}
                      </span>
                    </div>
                    {u.description && <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>{u.description}</div>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
              📦 Dados de Entrega e Faturamento
            </label>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem", marginTop: "-0.5rem" }}>
              Escolha como deseja receber seu pedido.
            </div>

            {/* Delivery Method Selection */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div
                onClick={() => setDeliveryMethod('shipping')}
                style={{
                  padding: "1rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: deliveryMethod === 'shipping' ? "rgba(108, 99, 255, 0.1)" : "var(--surface)",
                  border: deliveryMethod === 'shipping' ? "2px solid var(--accent)" : "1px solid var(--border)",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input type="radio" checked={deliveryMethod === 'shipping'} onChange={() => { }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Enviar p/ Endereço</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Receba via Correios ou Transportadora.</div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setDeliveryMethod('pickup')}
                style={{
                  padding: "1rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: deliveryMethod === 'pickup' ? "rgba(34, 197, 94, 0.1)" : "var(--surface)",
                  border: deliveryMethod === 'pickup' ? "2px solid #22c55e" : "1px solid var(--border)",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input type="radio" checked={deliveryMethod === 'pickup'} onChange={() => { }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: deliveryMethod === 'pickup' ? "#22c55e" : "var(--text)" }}>Retirar na Loja</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Retire sem custo em nossa unidade física.</div>
                  </div>
                </div>
              </div>
            </div>

            {deliveryMethod === 'pickup' && config?.company_address && (
              <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(34, 197, 94, 0.05)", borderRadius: "8px", border: "1px dashed #22c55e" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#166534", marginBottom: "0.25rem" }}>📍 Endereço para Retirada:</div>
                <div style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                  {config.company_address}{config.company_number ? `, ${config.company_number}` : ''}
                  {config.company_complement ? ` - ${config.company_complement}` : ''}<br />
                  {config.company_neighborhood ? `${config.company_neighborhood}, ` : ''}
                  {config.company_city} - {config.company_state}, CEP {config.company_zipcode}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="label">Nome Completo do Destinatário</label>
                <input type="text" className="input" placeholder="Ex: João da Silva" value={clientName} onChange={e => setClientName(e.target.value)} required />
              </div>
              <div>
                <label className="label">CPF ou CNPJ</label>
                <input type="text" className="input" placeholder="000.000.000-00" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} required />
              </div>
            </div>

            {deliveryMethod === 'shipping' && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">CEP</label>
                    <input type="text" className="input" placeholder="Ex: 01001-000" maxLength={9} value={zipcode} onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5, 8)}`;
                      setZipcode(v);
                    }} onBlur={(e) => handleZipcodeBlur(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Logradouro (Rua, Av, etc)</label>
                    <input type="text" className="input" placeholder="Rua das Flores" value={address} onChange={e => setAddress(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Número</label>
                    <input type="text" className="input" placeholder="123" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Complemento</label>
                    <input type="text" className="input" placeholder="Apt 42 (Opcional)" value={addressComp} onChange={e => setAddressComp(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Bairro</label>
                    <input type="text" className="input" placeholder="Centro" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="label">Cidade</label>
                    <input type="text" className="input" placeholder="São Paulo" value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">UF (Estado)</label>
                    <input type="text" className="input" placeholder="SP" maxLength={2} value={stateCode} onChange={e => setStateCode(e.target.value.toUpperCase())} required />
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <label className="label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🎟️ Possui um Cupom de Desconto?
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input type="text" className="input" placeholder="Ex: PROMO20" style={{ textTransform: "uppercase" }} value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={!!couponData} />
              {!couponData ? (
                <button type="button" onClick={handleValidateCoupon} disabled={validatingCoupon || !couponCode} className="btn btn-ghost" style={{ border: "1px solid var(--border)" }}>
                  {validatingCoupon ? "Validando..." : "Aplicar"}
                </button>
              ) : (
                <button type="button" onClick={() => { setCouponData(null); setCouponCode(""); setCouponMsg({ text: "", type: "" }); }} className="btn btn-ghost" style={{ color: "#ef4444", border: "1px solid #ef444444" }}>
                  Remover
                </button>
              )}
            </div>
            {couponMsg.text && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: couponMsg.type === "success" ? "var(--green)" : "#ef4444" }}>
                {couponMsg.text} {couponData && `(-${couponData.type === 'percentage' ? couponData.value + '%' : 'R$ ' + couponData.value})`}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1.5rem", padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        {/* Progress */}
        {loading && progress > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
              <span>Enviando dados e calculando assembly...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: "6px", background: "var(--bg-main)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", transition: "width 0.3s" }}></div>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", justifyContent: "center" }} disabled={loading}>
          {loading ? "Processando e Analisando Arquivos..." : "Analisar Montagem e Obter Preço"}
        </button>
      </form>
    </div>
  );
}
