"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

export default function OrcamentoManualPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialPref, setMaterialPref] = useState("PLA");
  const [estimatedDims, setEstimatedDims] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [clientName, setClientName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComp, setAddressComp] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [config, setConfig] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/client/me").then(r => r.json()).then(data => {
      if (!data.error) {
        if (data.name) setClientName(data.name);
        if (data.document) setDocumentNumber(data.document);
        if (data.zipcode) setZipcode(data.zipcode);
        if (data.address) setAddress(data.address);
        if (data.address_number) setAddressNumber(data.address_number);
        if (data.neighborhood) setNeighborhood(data.neighborhood);
        if (data.city) setCity(data.city);
        if (data.state) setStateCode(data.state);
      }
    }).catch(() => { });
    fetch("/api/config").then(r => r.json()).then(setConfig).catch(() => { });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setPhotos(files);
    setPhotoPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleZipcodeBlur = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setStateCode(data.uf || "");
      }
    } catch { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 20) {
      setError("A descrição precisa ter pelo menos 20 caracteres para que possamos entender o projeto.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Upload photos first
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fd = new FormData();
        fd.append("file", photo);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) photoUrls.push(data.url);
      }

      const res = await fetch("/api/quote-requests/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          reference_photos: photoUrls,
          material_preference: materialPref,
          estimated_dimensions: estimatedDims,
          client_name: clientName,
          client_document: documentNumber,
          delivery_method: deliveryMethod,
          client_zipcode: zipcode.replace(/\D/g, ""),
          client_address: address,
          client_address_number: addressNumber,
          client_address_comp: addressComp,
          client_neighborhood: neighborhood,
          client_city: city,
          client_state: stateCode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar solicitação");

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🎉</div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "1rem" }}>Solicitação Enviada!</h1>
        <p style={{ color: "var(--muted)", fontSize: "1rem", marginBottom: "2rem", lineHeight: 1.6 }}>
          Recebemos seu pedido de orçamento personalizado. Nossa equipe vai analisar as informações
          e você receberá uma mensagem no WhatsApp com a proposta de preço em breve.
        </p>
        <div style={{ padding: "1rem", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>⏳ Prazo de resposta:</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginTop: "0.25rem" }}>em até 24 horas úteis</div>
        </div>
        <Link href="/cliente" className="btn btn-primary" style={{ padding: "0.75rem 2rem" }}>
          Ir para minha conta
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/cliente/novo" className="btn btn-ghost" style={{ padding: "0.5rem 1rem", marginBottom: "1rem", display: "inline-block" }}>
          ← Voltar
        </Link>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 0.5rem" }}>📝 Orçamento Personalizado</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
          Não tem o arquivo 3D? Descreva o que precisa e envie fotos de referência. Nossa equipe entra em contato com a proposta!
        </p>
      </div>

      {status === "unauthenticated" && (
        <div style={{ padding: "1.25rem", background: "rgba(66, 133, 244, 0.08)", border: "1px dashed #4285F4", borderRadius: 12, marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Checkout mais rápido</div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Entre com Google para pré-preencher seus dados</div>
          </div>
          <button onClick={() => signIn("google")} className="btn" style={{ background: "white", color: "#333", border: "1px solid #ddd", fontWeight: 600 }}>
            Entrar com Google
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Project Details */}
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            📋 Sobre o Projeto
          </h2>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Nome / Título do Projeto</label>
            <input type="text" className="input" placeholder="Ex: Suporte para câmera GoPro, Peça de reposição motor X200..." value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">
              Descrição detalhada do que precisa <span style={{ color: "#ef4444" }}>*</span>
              <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: "0.5rem" }}>({description.length}/2000 caracteres)</span>
            </label>
            <textarea
              className="input"
              style={{ minHeight: 140, resize: "vertical", fontFamily: "inherit" }}
              placeholder="Descreva o que precisa imprimir: o que é, para que serve, dimensões aproximadas (cm/mm), material desejado, quantidade, detalhes de encaixe, etc.

Ex: Preciso de um suporte de parede para monitor de 27 polegadas, com encaixe em tubo de 4cm, material resistente pois ficará em área externa. Quantidade: 2 peças."
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 2000))}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="label">Material de Preferência</label>
              <select className="input" value={materialPref} onChange={e => setMaterialPref(e.target.value)}>
                <option value="PLA">PLA (Padrão, econômico)</option>
                <option value="PETG">PETG (Resistente, semi-flexível)</option>
                <option value="ABS">ABS (Alta temp., resistente)</option>
                <option value="TPU">TPU (Flexível, borrachoso)</option>
                <option value="Nylon">Nylon (Alta resistência mecânica)</option>
                <option value="Resina">Resina SLA (Alta resolução)</option>
                <option value="">Deixar a critério do técnico</option>
              </select>
            </div>
            <div>
              <label className="label">Dimensões aproximadas (opcional)</label>
              <input type="text" className="input" placeholder="Ex: 15cm x 8cm x 3cm" value={estimatedDims} onChange={e => setEstimatedDims(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            📸 Fotos de Referência (opcional — até 5 fotos)
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem", marginTop: 0 }}>
            Envie fotos do objeto original, esboços, referências de internet ou imagens similares ao que precisa.
          </p>

          <label htmlFor="photo-upload" style={{ display: "block", border: "2px dashed var(--border)", borderRadius: 10, padding: "1.5rem", textAlign: "center", cursor: "pointer", background: "var(--surface2)", transition: "all 0.2s" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Clique para selecionar imagens</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>JPG, PNG, WEBP — máximo 5 arquivos</div>
          </label>
          <input id="photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoChange} style={{ display: "none" }} />

          {photoPreviews.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginTop: "1rem" }}>
              {photoPreviews.map((src, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                  <img src={src} alt={`Ref ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => {
                      const newPhotos = photos.filter((_, idx) => idx !== i);
                      const newPreviews = photoPreviews.filter((_, idx) => idx !== i);
                      setPhotos(newPhotos);
                      setPhotoPreviews(newPreviews);
                    }}
                    style={{ position: "absolute", top: "0.25rem", right: "0.25rem", background: "rgba(239,68,68,0.85)", border: "none", color: "white", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery & Contact */}
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            📦 Entrega e Identificação
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">Seu nome completo</label>
              <input type="text" className="input" placeholder="Ex: João da Silva" value={clientName} onChange={e => setClientName(e.target.value)} required />
            </div>
            <div>
              <label className="label">CPF ou CNPJ</label>
              <input type="text" className="input" placeholder="000.000.000-00" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} />
            </div>
          </div>

          {/* Delivery method */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            {[
              { value: 'shipping', icon: '🚚', label: 'Enviar p/ Endereço', sub: 'Receba via Correios ou Transportadora' },
              { value: 'pickup', icon: '🏪', label: 'Retirar na Loja', sub: 'Retire sem custo em nossa unidade física' }
            ].map(opt => (
              <div key={opt.value} onClick={() => setDeliveryMethod(opt.value as any)}
                style={{ padding: "1rem", borderRadius: 10, cursor: "pointer", border: deliveryMethod === opt.value ? "2px solid var(--accent)" : "1px solid var(--border)", background: deliveryMethod === opt.value ? "rgba(108,99,255,0.07)" : "var(--surface)", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input type="radio" readOnly checked={deliveryMethod === opt.value} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{opt.icon} {opt.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{opt.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {deliveryMethod === 'pickup' && config?.company_address && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(34,197,94,0.05)", border: "1px dashed #22c55e", borderRadius: 8, fontSize: "0.85rem" }}>
              📍 <strong>Endereço para Retirada:</strong> {config.company_address}, {config.company_number} — {config.company_city}/{config.company_state}
            </div>
          )}

          {deliveryMethod === 'shipping' && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">CEP</label>
                  <input type="text" className="input" placeholder="01001-000" maxLength={9}
                    value={zipcode}
                    onChange={e => { let v = e.target.value.replace(/\D/g, ""); if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5, 8)}`; setZipcode(v); }}
                    onBlur={e => handleZipcodeBlur(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Logradouro</label>
                  <input type="text" className="input" placeholder="Rua das Flores" value={address} onChange={e => setAddress(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Número</label>
                  <input type="text" className="input" placeholder="123" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Bairro</label>
                  <input type="text" className="input" placeholder="Centro" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required />
                </div>
                <div>
                  <label className="label">UF</label>
                  <input type="text" className="input" placeholder="SP" maxLength={2} value={stateCode} onChange={e => setStateCode(e.target.value.toUpperCase())} required />
                </div>
              </div>
              <div>
                <label className="label">Cidade</label>
                <input type="text" className="input" placeholder="São Paulo" value={city} onChange={e => setCity(e.target.value)} required />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", fontWeight: 800, justifyContent: "center" }}>
          {loading ? "⏳ Enviando solicitação..." : "📩 Enviar Solicitação de Orçamento"}
        </button>
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
          Após o envio, nossa equipe analisa e responde em até 24h por WhatsApp com a proposta de preço.
        </p>
      </form>
    </div>
  );
}
