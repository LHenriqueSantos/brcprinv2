"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, PlayCircle, ShoppingCart } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { STLLoader } from "three-stdlib";
import Link from "next/link";
import * as THREE from "three";

function STLModel({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (!url) return;
    const loader = new STLLoader();
    loader.load(url, (geo) => {
      geo.computeVertexNormals();
      geo.center();
      setGeometry(geo);
    });
  }, [url]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#6c63ff" roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

export default function ParametricModelBuilder() {
  const params = useParams();
  const router = useRouter();

  const [model, setModel] = useState<any>(null);
  const [schema, setSchema] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedStlUrl, setGeneratedStlUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/scad-models`)
      .then(r => r.json())
      .then(data => {
        const found = data.find((m: any) => m.id === Number(params.id));
        if (found) {
          setModel(found);
          const sch = typeof found.parameters_schema === 'string' ? JSON.parse(found.parameters_schema) : found.parameters_schema;
          setSchema(sch || []);

          // Initialize default values
          const defaults: Record<string, any> = {};
          sch.forEach((s: any) => { defaults[s.name] = s.default; });
          setFormValues(defaults);
        }
        setLoading(false);
      });
  }, [params.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedStlUrl(null);

    try {
      const res = await fetch("/api/scad/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: model.id, parameters: formValues })
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      if (data.stl_url) {
        setGeneratedStlUrl(data.stl_url);
        alert("Seu arquivo 3D customizado foi concluído com sucesso.");
      } else {
        throw new Error("Resposta inválida do servidor de malhas.");
      }
    } catch (e: any) {
      alert(`Falha na Compilação Paramétrica: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleQuote = () => {
    if (!generatedStlUrl) return;
    // Save to local storage to be picked up by the nova-cotacao flow
    localStorage.setItem("pending_parametric_stl", generatedStlUrl);
    localStorage.setItem("pending_parametric_title", `Peça Custom: ${model.title}`);
    router.push("/cliente/novo?source=parametric");
  };

  if (loading) return <div style={{ textAlign: "center", padding: "5rem", color: "var(--accent)" }}>Carregando motor paramétrico...</div>;
  if (!model) return <div style={{ textAlign: "center", padding: "5rem", color: "#ef4444" }}>Modelo não encontrado na base.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Navbar Minimalista (Global) */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.5rem 2rem",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "rgba(10, 10, 10, 0.8)",
          backdropFilter: "blur(12px)",
          zIndex: 100
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/">
            <img src="/brcprint.svg" alt="BRCPrint Logo" style={{ height: "40px", objectFit: "contain" }} />
          </Link>
        </div>
        <nav className="nav-links">
          <Link href="/catalogo" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Produtos</Link>
          <Link href="/modelos-parametricos" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700, transition: "color 0.2s" }} className="hover-glow-text">Customizáveis</Link>
          <Link href="/#como-funciona" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Como Funciona</Link>
          <Link href="/#beneficios" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} className="hover-glow-text">Vantagens</Link>

          <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 0.5rem" }} />

          <Link href="/carrinho" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }} className="hover-glow-text">
            <ShoppingCart size={18} /> Carrinho
          </Link>

          <Link href="/cliente/login" className="btn btn-primary shadow-glow" style={{ padding: "0.6rem 1.2rem", fontSize: "0.95rem", borderRadius: "8px" }}>
            Acessar Sistema
          </Link>
        </nav>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem", minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/modelos-parametricos" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", background: "var(--surface)", color: "var(--text)", textDecoration: "none" }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>{model.title}</h1>
            <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>Personalize as marcações desta malha — A partir de R$ {Number(model.basePrice || model.base_price).toFixed(2)}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", flex: 1, minHeight: 0 }}>

          {/* Left Col: Params Form */}
          <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", padding: "1.5rem", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1.5rem 0", color: "var(--text)" }}>Parâmetros da Malha</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>
              {schema.map((p, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label className="label" style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                    {p.description || p.name}
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)", marginLeft: "0.5rem", fontFamily: "monospace" }}>({p.type})</span>
                  </label>

                  {p.type === "number" ? (
                    <input
                      type="number"
                      className="input"
                      value={formValues[p.name] ?? ""}
                      onChange={e => setFormValues({ ...formValues, [p.name]: Number(e.target.value) })}
                    />
                  ) : p.type === "boolean" ? (
                    <select
                      className="input"
                      value={formValues[p.name]?.toString() || "false"}
                      onChange={e => setFormValues({ ...formValues, [p.name]: e.target.value === "true" })}
                    >
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="input"
                      value={formValues[p.name] ?? ""}
                      onChange={e => setFormValues({ ...formValues, [p.name]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary"
                style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                {generating ? (
                  <><Loader2 size={20} className="animate-spin" /> Compilando Código C++...</>
                ) : (
                  <><PlayCircle size={20} /> Gerar Meu Objeto</>
                )}
              </button>
            </div>
          </div>

          {/* Right Col: 3D Viewer */}
          <div style={{ background: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>

            {!generatedStlUrl && !generating && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", zIndex: 10, textAlign: "center", padding: "2rem" }}>
                <img src={model.image_url || "/brcprint.png"} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12, marginBottom: "1.5rem", opacity: 0.6, filter: "grayscale(100%)" }} />
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#fff" }}>Motor Adormecido</h3>
                <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: 400, margin: 0, lineHeight: 1.5 }}>Preencha os seus desejos no painel da esquerda e aperte "Gerar". Isso ativará os servidores SCAD virtuais para fabricar a sua peça em tempo real.</p>
              </div>
            )}

            {generating && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", zIndex: 10 }}>
                <Loader2 size={48} className="animate-spin" style={{ color: "var(--accent)", marginBottom: "1rem" }} />
                <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "#fff", animation: "pulse 2s infinite" }}>Sintetizando geometria complexa...</p>
              </div>
            )}

            {generatedStlUrl && (
              <Canvas shadows camera={{ position: [0, 0, 100], fov: 50 }}>
                <color attach="background" args={["transparent"]} />
                <Stage environment="city" intensity={0.5}>
                  <STLModel url={generatedStlUrl} />
                </Stage>
                <OrbitControls makeDefault autoRotate autoRotateSpeed={2} />
              </Canvas>
            )}

            {generatedStlUrl && (
              <div style={{ position: "absolute", bottom: "1.5rem", right: "1.5rem", zIndex: 20 }}>
                <button
                  onClick={handleQuote}
                  className="btn"
                  style={{ background: "#059669", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 1.5rem", fontSize: "1.1rem", boxShadow: "0 10px 25px rgba(5, 150, 105, 0.3)" }}
                >
                  <ShoppingCart size={20} /> Avançar para Orçamento Exato
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
