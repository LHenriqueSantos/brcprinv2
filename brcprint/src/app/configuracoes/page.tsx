"use client";

import { useEffect, useState } from "react";

const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="card" style={{ marginBottom: "1.25rem" }}>
    <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem", display: "flex", gap: "0.5rem" }}>
      <span>{icon}</span> {title}
    </h2>
    {children}
  </div>
);

const TabButton = ({ id, label, icon, activeTab, onClick }: { id: string; label: string; icon: string, activeTab: string, onClick: (id: string) => void }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    style={{
      padding: "0.75rem 1.25rem",
      background: activeTab === id ? "var(--surface)" : "transparent",
      color: activeTab === id ? "var(--text)" : "var(--muted)",
      border: "none",
      borderBottom: activeTab === id ? "2px solid var(--accent)" : "2px solid transparent",
      fontWeight: activeTab === id ? 700 : 500,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "all 0.2s"
    }}
  >
    <span>{icon}</span> {label}
  </button>
);

export default function ConfigPage() {
  const [form, setForm] = useState({
    energy_kwh_price: "",
    labor_hourly_rate: "",
    default_profit_margin_pct: "",
    default_loss_pct: "",
    spare_parts_reserve_pct: "",
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_pass: "",
    sender_email: "",
    enable_3d_viewer: true,
    enable_timeline: true,
    enable_chat: true,
    enable_stripe: false,
    stripe_public_key: "",
    stripe_secret_key: "",
    enable_auto_quoting: false,
    enable_whatsapp: false,
    whatsapp_api_url: "",
    whatsapp_instance_id: "",
    whatsapp_api_token: "",
    company_zipcode: "",
    company_address: "",
    company_number: "",
    company_complement: "",
    company_neighborhood: "",
    company_city: "",
    company_state: "",
    packaging_length: "",
    packaging_width: "",
    packaging_height: "",
    packaging_cost: "",
    shipping_api_provider: "none",
    shipping_api_token: "",
    currency_code: "BRL",
    currency_symbol: "R$",
    language_default: "pt",
    default_tax_pct: "0",
    enable_mercadopago: false,
    mp_access_token: "",
    mp_public_key: "",
    enable_cashback: false,
    cashback_pct: "",
    api_key: "",
    webhook_url: "",
    enable_multicolor: false,
    multicolor_markup_pct: "",
    multicolor_waste_g: "",
    multicolor_hours_added: "",
    energy_flag: "green",
    energy_peak_price: "",
    energy_off_peak_price: "",
    energy_peak_start: "18:00",
    energy_peak_end: "21:00"
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("geral");
  const [packagingSizes, setPackagingSizes] = useState<any[]>([]);

  const fetchPackaging = async () => {
    try {
      const res = await fetch("/api/packaging");
      const data = await res.json();
      setPackagingSizes(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          energy_kwh_price: d.energy_kwh_price ?? "",
          labor_hourly_rate: d.labor_hourly_rate ?? "",
          default_profit_margin_pct: d.default_profit_margin_pct ?? "",
          default_loss_pct: d.default_loss_pct ?? "",
          spare_parts_reserve_pct: d.spare_parts_reserve_pct ?? "",
          smtp_host: d.smtp_host ?? "",
          smtp_port: d.smtp_port ?? "",
          smtp_user: d.smtp_user ?? "",
          smtp_pass: d.smtp_pass ?? "",
          sender_email: d.sender_email ?? "",
          enable_3d_viewer: d.enable_3d_viewer !== undefined ? !!d.enable_3d_viewer : true,
          enable_timeline: d.enable_timeline !== undefined ? !!d.enable_timeline : true,
          enable_chat: d.enable_chat !== undefined ? !!d.enable_chat : true,
          enable_stripe: d.enable_stripe !== undefined ? !!d.enable_stripe : false,
          stripe_public_key: d.stripe_public_key ?? "",
          stripe_secret_key: d.stripe_secret_key ?? "",
          enable_auto_quoting: d.enable_auto_quoting !== undefined ? !!d.enable_auto_quoting : false,
          enable_whatsapp: d.enable_whatsapp !== undefined ? !!d.enable_whatsapp : false,
          whatsapp_api_url: d.whatsapp_api_url ?? "",
          whatsapp_instance_id: d.whatsapp_instance_id ?? "",
          whatsapp_api_token: d.whatsapp_api_token ?? "",
          company_zipcode: d.company_zipcode ?? "",
          company_address: d.company_address ?? "",
          company_number: d.company_number ?? "",
          company_complement: d.company_complement ?? "",
          company_neighborhood: d.company_neighborhood ?? "",
          company_city: d.company_city ?? "",
          company_state: d.company_state ?? "",
          packaging_length: d.packaging_length ?? "",
          packaging_width: d.packaging_width ?? "",
          packaging_height: d.packaging_height ?? "",
          packaging_cost: d.packaging_cost ?? "",
          shipping_api_provider: d.shipping_api_provider ?? "none",
          shipping_api_token: d.shipping_api_token ?? "",
          currency_code: d.currency_code ?? "BRL",
          currency_symbol: d.currency_symbol ?? "R$",
          language_default: d.language_default ?? "pt",
          default_tax_pct: d.default_tax_pct ?? "0",
          enable_mercadopago: d.enable_mercadopago !== undefined ? !!d.enable_mercadopago : false,
          mp_access_token: d.mp_access_token ?? "",
          mp_public_key: d.mp_public_key ?? "",
          enable_cashback: d.enable_cashback !== undefined ? !!d.enable_cashback : false,
          cashback_pct: d.cashback_pct ?? "5.00",
          api_key: d.api_key ?? "",
          webhook_url: d.webhook_url ?? "",
          enable_multicolor: d.enable_multicolor !== undefined ? !!d.enable_multicolor : false,
          multicolor_markup_pct: d.multicolor_markup_pct ?? "15.00",
          multicolor_waste_g: d.multicolor_waste_g ?? "50",
          multicolor_hours_added: d.multicolor_hours_added ?? "1.5",
          energy_flag: d.energy_flag ?? "green",
          energy_peak_price: d.energy_peak_price ?? "",
          energy_off_peak_price: d.energy_off_peak_price ?? "",
          energy_peak_start: d.energy_peak_start ? d.energy_peak_start.slice(0, 5) : "18:00",
          energy_peak_end: d.energy_peak_end ? d.energy_peak_end.slice(0, 5) : "21:00"
        });
      });
    fetchPackaging();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Falha ao salvar configurações");
      }

      const updatedData = await res.json();
      setForm(prev => ({
        ...prev,
        ...updatedData,
        // Garante que campos que vem como 1/0 do DB sejam convertidos para boolean
        enable_3d_viewer: !!updatedData.enable_3d_viewer,
        enable_timeline: !!updatedData.enable_timeline,
        enable_chat: !!updatedData.enable_chat,
        enable_stripe: !!updatedData.enable_stripe,
        enable_auto_quoting: !!updatedData.enable_auto_quoting,
        enable_whatsapp: !!updatedData.enable_whatsapp,
        enable_mercadopago: !!updatedData.enable_mercadopago,
        enable_cashback: !!updatedData.enable_cashback,
        enable_multicolor: !!updatedData.enable_multicolor
      }));

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePackaging = async (box: any) => {
    try {
      await fetch("/api/packaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(box)
      });
      fetchPackaging();
    } catch (error) {
      alert("Erro ao salvar embalagem");
    }
  };

  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "brc_";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, api_key: key });
  };

  const field = (label: string, key: keyof typeof form, help: string, prefix = "", inputType = "number", inputStep = "0.0001") => (
    <div style={{ marginBottom: "1.25rem" }}>
      <label className="label">{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              fontSize: "0.875rem",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          className="input"
          type={inputType}
          step={inputType === "number" ? inputStep : undefined}
          style={{ paddingLeft: prefix ? "2.5rem" : undefined }}
          value={(form[key] as string) || ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.3rem" }}>{help}</div>
    </div>
  );

  const toggleField = (label: string, key: keyof typeof form, help: string) => (
    <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
      <input
        id={`toggle-${key}`}
        type="checkbox"
        checked={!!form[key]}
        onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.checked }))}
        style={{ width: 18, height: 18, marginTop: 4, cursor: "pointer", accentColor: "var(--accent)" }}
      />
      <div>
        <label
          htmlFor={`toggle-${key}`}
          style={{ fontWeight: 600, display: "block", marginBottom: "0.2rem", cursor: "pointer" }}
        >
          {label}
        </label>
        <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{help}</div>
      </div>
    </div>
  );



  return (
    <div style={{ maxWidth: 1920 }}>
      {/* ... (Existing header code) */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Configurações</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Parâmetros globais usados em todas as cotações
          </p>
        </div>
        <button type="button" onClick={handleSubmit} className="btn btn-primary" disabled={saving} style={{ padding: "0.5rem 2rem" }}>
          {saving ? "Salvando…" : saved ? "✅ Salvo!" : "Salvar"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", marginBottom: "2rem", overflowX: "auto" }}>
        <TabButton id="geral" label="Financeiro" icon="📊" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="plataforma" label="Plataforma" icon="✨" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="logistica" label="Logística" icon="📦" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="energia" label="Energia" icon="⚡" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="pagamentos" label="Financeiro" icon="💳" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="comunicacao" label="Comunicações" icon="💬" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="marketing" label="Marketing" icon="🎁" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="dev" label="Desenvolvedores" icon="🛠️" activeTab={activeTab} onClick={setActiveTab} />
      </div>

      <form onSubmit={handleSubmit}>
        {/* ... (Existing tabs code) */}
        {activeTab === "geral" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <Section title="Energia Elétrica" icon="⚡">
              {field("Custo por kWh", "energy_kwh_price", "Verifique sua conta de energia elétrica (ex: 0,75)", "R$")}
            </Section>

            <Section title="Mão de Obra" icon="👷">
              {field("Taxa horária do profissional", "labor_hourly_rate", "Custo por hora do operador/designer (ex: 50)", "R$")}
            </Section>

            <div style={{ gridColumn: "1 / -1" }}>
              <Section title="Margens e Reservas" icon="📈">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                  {field("Margem de lucro (%)", "default_profit_margin_pct", "Adicionado ao custo de produção", "", "number", "0.01")}
                  {field("Perdas (%)", "default_loss_pct", "Material perdido em falhas (ex: 5)", "", "number", "0.01")}
                  {field("Peças reposição (%)", "spare_parts_reserve_pct", "Custo guardado para peças (ex: 10)", "", "number", "0.01")}
                </div>
              </Section>
            </div>
            <div style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
              <Section title="Precificação Multi-color (AMS/MMU)" icon="🎨">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                  {field("Markup de Risco (%)", "multicolor_markup_pct", "Taxa extra p/ impressão colorida (ex: 20)", "", "number", "0.01")}
                  {field("Waste Torre Purga (g)", "multicolor_waste_g", "Custo repassado de filamento", "g", "number", "1")}
                  {field("Hora Extra Trocas (h)", "multicolor_hours_added", "Tempo add de custo", "h", "number", "0.1")}
                </div>
              </Section>
            </div>
          </div>
        )}

        {activeTab === "plataforma" && (
          <>
            <Section title="Funcionalidades da Plataforma (Features)" icon="✨">
              {toggleField("Fatiamento Automatizado (Instant Quoting)", "enable_auto_quoting", "Gera o orçamento instantaneamente ao fazer upload de STL se o material e impressora padrão estiverem disponíveis.")}
              {toggleField("Visualizador 3D Interativo", "enable_3d_viewer", "Permite que os clientes e você vejam os modelos 3D STL diretamente no navegador.")}
              {toggleField("Timeline de Rastreio (Status)", "enable_timeline", "Mostra a barra de progresso visual (Orçado > Aprovado > Em Produção > Finalizado).")}
              {toggleField("Suporte Multi-color (AMS/MMU)", "enable_multicolor", "Ativa o check-box no formulário para precificar e cobrar taxa extra por impressões coloridas.")}
              {toggleField("Central de Mensagens (Chat)", "enable_chat", "Ativa o chat em tempo real dentro das páginas de cotação para o cliente e o suporte.")}
            </Section>

            <Section title="Automações (CRON Jobs)" icon="🤖">
              <div style={{ padding: "1rem", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>Recuperação de Carrinho Abandonado</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1rem" }}>
                  Essa URL verifica cotações com mais de 24 horas paradas e dispara um E-mail (e WhatsApp, se ativo) chamando o cliente para fechar a compra. Configure em um serviço grátis como o <strong>Cron-job.org</strong> para acessá-la a cada 1 hora.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <code style={{ display: "block", width: "100%", padding: "0.75rem", background: "var(--background)", borderRadius: 4, border: "1px dashed var(--border)", fontSize: "0.75rem", userSelect: "all", color: "var(--accent)" }}>
                    {typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.com.br'}/api/cron/abandoned-quotes?secret=brcprint-cron-secret-2024
                  </code>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "logistica" && (
          <Section title="Logística e Entrega (Endereço de Retirada)" icon="📦">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "1rem" }}>
              {field("CEP de Origem (Sua Loja)", "company_zipcode", "CEP para cálculo de frete e retirada", "", "text", "")}
              {field("Logradouro", "company_address", "Rua, Avenida, etc.", "", "text", "")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "1rem" }}>
              {field("Número", "company_number", "Ex: 123", "", "text", "")}
              {field("Complemento", "company_complement", "Apto, Sala, Bloco", "", "text", "")}
              {field("Bairro", "company_neighborhood", "Ex: Centro", "", "text", "")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
              {field("Cidade", "company_city", "Ex: São Paulo", "", "text", "")}
              {field("Estado (UF)", "company_state", "Ex: SP", "", "text", "")}
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Caixas / Embalagens Ativas</h3>
                <button type="button" className="btn btn-primary" onClick={() => savePackaging({ name: "Nova Caixa", length_cm: 20, width_cm: 20, height_cm: 15, cost: 0 })} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", height: "auto" }}>+ Adicionar</button>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1rem" }}>
                Estas dimensões serão utilizadas para calcular os fretes reais e volumétricos a depender do modelo 3D carregado pelo cliente.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {packagingSizes.map((box) => (
                  <div key={box.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: "0.5rem", alignItems: "flex-end", padding: "0.5rem", border: "1px solid var(--border)", borderRadius: 6, background: "var(--background)" }}>
                    <label className="label" style={{ margin: 0 }}>
                      Nome
                      <input type="text" className="input" defaultValue={box.name} onBlur={(e) => savePackaging({ ...box, name: e.target.value })} style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "30px" }} />
                    </label>
                    <label className="label" style={{ margin: 0 }}>
                      Comp (cm)
                      <input type="number" step="0.01" className="input" defaultValue={box.length_cm} onBlur={(e) => savePackaging({ ...box, length_cm: e.target.value })} style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "30px" }} />
                    </label>
                    <label className="label" style={{ margin: 0 }}>
                      Larg (cm)
                      <input type="number" step="0.01" className="input" defaultValue={box.width_cm} onBlur={(e) => savePackaging({ ...box, width_cm: e.target.value })} style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "30px" }} />
                    </label>
                    <label className="label" style={{ margin: 0 }}>
                      Alt (cm)
                      <input type="number" step="0.01" className="input" defaultValue={box.height_cm} onBlur={(e) => savePackaging({ ...box, height_cm: e.target.value })} style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "30px" }} />
                    </label>
                    <label className="label" style={{ margin: 0 }}>
                      Custo (R$)
                      <input type="number" step="0.01" className="input" defaultValue={box.cost} onBlur={(e) => savePackaging({ ...box, cost: e.target.value })} style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "30px" }} />
                    </label>
                    <button type="button" className="btn btn-ghost" onClick={() => { if (confirm("Desativar esta caixa?")) savePackaging({ ...box, active: 0 }) }} style={{ padding: "0 0.5rem", height: "30px", color: "var(--red)" }}>Excluir</button>
                  </div>
                ))}
                {packagingSizes.length === 0 && <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>Nenhuma caixa configurada. Adicione uma.</div>}
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <label className="label">Provedor de Cálculo de Frete</label>
              <select
                className="input"
                value={form.shipping_api_provider}
                onChange={(e) => setForm({ ...form, shipping_api_provider: e.target.value })}
                style={{ paddingLeft: "1rem" }}
              >
                <option value="none">Nenhum (Somente Frete Fixo/Manual)</option>
                <option value="melhorenvio">Melhor Envio</option>
                <option value="frenet">Frenet</option>
              </select>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                Selecione o gateway para cotação automática de etiquetas (PAC/Sedex/Transportadoras).
              </div>

              {form.shipping_api_provider !== 'none' && (
                <div style={{ marginTop: "1rem" }}>
                  {field("Token de API / Chave de Acesso", "shipping_api_token", "Insira o token de produção fornecido pelo gateway", "", "password", "")}
                </div>
              )}
            </div>
          </Section>
        )}

        {activeTab === "pagamentos" && (
          <>
            <Section title="Localização e Tributos (i18n)" icon="🌍">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                {field("Código Moeda (ISO)", "currency_code", "Ex: BRL, USD", "", "text", "")}
                {field("Símbolo Moeda", "currency_symbol", "Ex: R$, $", "", "text", "")}
                <div>
                  <label className="label">Idioma Inicial Frontend</label>
                  <select
                    className="input"
                    value={form.language_default}
                    onChange={(e) => setForm({ ...form, language_default: e.target.value })}
                  >
                    <option value="pt">Português</option>
                    <option value="en">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
              {field("Imposto / Taxa Regional (%)", "default_tax_pct", "Ex: 10 para 10%", "", "number", "0.01")}
            </Section>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <Section title="MercadoPago (PIX)" icon="🏦">
                {toggleField("Ativar PIX Checkout", "enable_mercadopago", "Gera QR Códos na aprovação de cotações para pagamento automático.")}
                {form.enable_mercadopago && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "#009ee311", borderRadius: 8, border: "1px solid #009ee333" }}>
                    {field("Access Token (Produção)", "mp_access_token", "APP_USR-...", "", "password", "")}
                    {field("Public Key (Produção)", "mp_public_key", "APP_USR-...", "", "text", "")}
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "1rem" }}>
                      🔗 Webhook URL: <code style={{ userSelect: "all" }}>https://seu-dominio/api/webhooks/mercadopago</code>
                    </div>
                  </div>
                )}
              </Section>

              <Section title="Stripe (Cartão)" icon="💳">
                {toggleField("Ativar Stripe Checkout", "enable_stripe", "Habilita sessões de checkout via cartão de crédito.")}
                {form.enable_stripe && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    {field("Publishable Key", "stripe_public_key", "pk_live_...", "", "text", "")}
                    {field("Secret Key", "stripe_secret_key", "sk_live_...", "", "password", "")}
                  </div>
                )}
              </Section>
            </div>
          </>
        )}

        {activeTab === "comunicacao" && (
          <>
            <Section title="WhatsApp (Push & Notificações)" icon="💬">
              {toggleField("Habilitar Envios por WhatsApp", "enable_whatsapp", "Avisa clientes quando o produto for enviado ou embalado via APIs não-oficiais tipo Evolution/Z-API.")}
              {form.enable_whatsapp && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "#25D36611", borderRadius: 8, border: "1px solid #25D36633" }}>
                  {field("Webhook URL de Disparo", "whatsapp_api_url", "Ex: https://api.z-api/instance/send-text", "", "text", "")}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                    {field("Instance ID (Evolution)", "whatsapp_instance_id", "Exclusivo p/ APIs Evolution", "", "text", "")}
                    {field("Token Bearer (Global)", "whatsapp_api_token", "Chave primária de acesso API", "", "password", "")}
                  </div>
                </div>
              )}
            </Section>

            <Section title="E-mail Padrão (SMTP)" icon="📧">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                {field("Servidor de Envio (SMTP)", "smtp_host", "Ex: smtp.gmail.com", "", "text", "")}
                {field("Porta", "smtp_port", "Ex: 465 ou 587", "", "number", "1")}
                {field("Usuário de Autenticação", "smtp_user", "Seu e-mail de login com o provedor", "", "text", "")}
                {field("Senha Autenticada", "smtp_pass", "Senha ou App Password do Google", "", "password", "")}
                <div style={{ gridColumn: "1 / -1" }}>
                  {field("E-mail Remetente (Público)", "sender_email", "Assinatura mostrada para quem recebe seu contato", "", "text", "")}
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "marketing" && (
          <Section title="Cashback e Fidelidade" icon="🎁">
            {toggleField("Ativar Programa de Cashback", "enable_cashback", "A cada pedido entregue, o cliente acumula um saldo virtual (wallet) para gastar na próxima impressão, incentivando o retorno.")}
            {form.enable_cashback && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                {field("Porcentagem de Retorno (%)", "cashback_pct", "Porcentagem do valor do pedido convertido em saldo (ex: 5 para 5%)", "", "number", "0.01")}
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "1rem 0 0" }}>
                  💡 Dica: O saldo será injetado automaticamente na conta do cliente assim que o status da cotação for movido para "Finalizado/Entregue". No próximo checkout feito via PIX/Cartão, o saldo será deduzido do total de forma automática.
                </p>
              </div>
            )}
          </Section>
        )}

        {activeTab === "dev" && (
          <Section title="API Externa & Webhooks" icon="🛠️">
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
              <div>
                <label className="label">Chave de API (Secret Key)</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    className="input"
                    type="text"
                    readOnly
                    value={form.api_key}
                    placeholder="Nenhuma chave gerada"
                    style={{ background: "var(--surface2)", flex: 1 }}
                  />
                  <button type="button" onClick={generateApiKey} className="btn" style={{ border: "1px solid var(--border)", padding: "0 1.5rem" }}>
                    Gerar Nova Chave
                  </button>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                  Use esta chave no cabeçalho <code>Authorization: Bearer [SUA_CHAVE]</code> para acessar APIs externas (em breve).
                </div>
              </div>

              {field("Webhook URL (Outbound)", "webhook_url", "URL do Zapier / Make / ERP que receberá os dados do pedido ao ser pago.", "🔗", "text")}

              <div style={{ padding: "1rem", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>Como funciona?</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  Sempre que uma cotação for marcada como <strong>Em Produção</strong> (pagamento confirmado via PIX ou Admin), o BRCPrint enviará um POST JSON para a URL configurada acima contendo todos os dados do cliente, peças e valores.
                </p>
              </div>
            </div>
          </Section>
        )}
        {activeTab === "energia" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <Section title="Bandeira Tarifária" icon="🚩">
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="label">Bandeira Atual</label>
                <select
                  className="input"
                  value={form.energy_flag}
                  onChange={e => setForm({ ...form, energy_flag: e.target.value as any })}
                >
                  <option value="green">🟢 Verde (Sem acréscimo)</option>
                  <option value="yellow">🟡 Amarela (+ R$ 1.88 / 100kWh)</option>
                  <option value="red1">🔴 Vermelha 1 (+ R$ 4.46 / 100kWh)</option>
                  <option value="red2">🔴 Vermelha 2 (+ R$ 7.88 / 100kWh)</option>
                </select>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                  Define o custo extra regulatório aplicado em tempo real.
                </div>
              </div>
            </Section>

            <Section title="Tarifa Branca (Ponta vs Fora de Ponta)" icon="⏳">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {field("Início Pico (Ponta)", "energy_peak_start", "Início do horário caro", "", "time")}
                {field("Fim Pico (Ponta)", "energy_peak_end", "Fim do horário caro", "", "time")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                {field("Preço Ponta (R$/kWh)", "energy_peak_price", "Custo no pico", "R$")}
                {field("Preço Fora Ponta (R$/kWh)", "energy_off_peak_price", "Custo normal", "R$")}
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "1rem" }}>
                💡 O Motor de Fila usará estes valores para calcular a rentabilidade real de cada trabalho baseado no horário de início agendado.
              </p>
            </Section>
          </div>
        )}
      </form>
    </div>
  );
}
