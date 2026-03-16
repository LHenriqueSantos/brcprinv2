import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import QRCode from "qrcode";

// Register a clean font (built-in)
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1e293b" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottom: "2px solid #3c5077", paddingBottom: 12 },
  logo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#3c5077" },
  logoSub: { fontSize: 8, color: "#94a3b8" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#3c5077", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, borderBottom: "1px solid #e2e8f0", paddingBottom: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  label: { color: "#64748b", flex: 2 },
  value: { fontFamily: "Helvetica-Bold", flex: 1, textAlign: "right" },
  totalBox: { backgroundColor: "#f1f5f9", borderRadius: 4, padding: 10, marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  finalBox: { backgroundColor: "#3c5077", borderRadius: 6, padding: 15, marginTop: 10, flexDirection: "column", alignItems: "center" },
  finalLabel: { color: "#ffffff", fontSize: 10, opacity: 0.9, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  finalValue: { color: "#ffffff", fontSize: 24, fontFamily: "Helvetica-Bold" },
  subValue: { color: "#ffffff", fontSize: 10, opacity: 0.8, marginTop: 6, borderTop: "1px solid #ffffff44", paddingTop: 4, width: "100%", textAlign: "center" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTop: "1px solid #e2e8f0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
  portalBox: { backgroundColor: "#f8f7ff", borderRadius: 4, padding: 8, marginTop: 10, border: "1px solid #3c5077" },
  portalLabel: { fontSize: 8, color: "#3c5077", fontFamily: "Helvetica-Bold", marginBottom: 2 },
  portalLink: { fontSize: 8, color: "#1e293b" },
  statusBadge: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#22c55e" },
});

const getLocales = (lang: string) => {
  const dicts: any = {
    pt: {
      title: "COTAÇÃO",
      issued: "Emitida em",
      valid: "Válida até",
      approved: "✓ APROVADA",
      client: "Cliente",
      name: "Nome",
      company: "Empresa",
      email: "E-mail",
      phone: "Telefone",
      details: "Dados de Impressão",
      description: "Descrição",
      printer: "Impressora",
      filament: "Filamento",
      time: "Tempo de impressão",
      weight: "Filamento utilizado",
      setup: "Tempo de setup",
      post: "Pós-processamento",
      qty: "Quantidade",
      unit: "peça(s)",
      composition: "Composição de Custos",
      hours: "Horas de impressão",
      material: "Material utilizado",
      energy: "Energia elétrica",
      labor: "Mão de obra",
      extras: "Produtos & Serviços Extras",
      subtotal_extras: "Subtotal extras",
      final_label: "Preço Final por Peça",
      lot: "Lote",
      counter_title: "CONTRAPROPOSTA DO CLIENTE",
      counter_price: "Valor proposto",
      approval_link: "LINK DE APROVAÇÃO DO CLIENTE",
      system_name: "brcprint – Sua impressão 3D",
      footer_generated: "gerada em",
      tax: "Impostos",
      shipping: "Frete",
      cashback: "Cashback Aplicado",
      total_order: "TOTAL DO PEDIDO",
      of: "de",
      per_unit: "por peça",
      awaiting_payment: "AGUARDANDO PAGAMENTO",
    },
    en: {
      title: "QUOTE",
      issued: "Issued on",
      valid: "Valid until",
      approved: "✓ APPROVED",
      client: "Client",
      name: "Name",
      company: "Company",
      email: "Email",
      phone: "Phone",
      details: "Print Details",
      description: "Description",
      printer: "Printer",
      filament: "Filament",
      time: "Print time",
      weight: "Material used",
      setup: "Setup time",
      post: "Post-processing",
      qty: "Quantity",
      unit: "unit(s)",
      composition: "Cost Breakdown",
      hours: "Printing hours",
      material: "Material used",
      energy: "Electricity",
      labor: "Labor",
      extras: "Extra Products & Services",
      subtotal_extras: "Extras subtotal",
      final_label: "Final Price per Unit",
      lot: "Batch",
      counter_title: "CUSTOMER COUNTER-OFFER",
      counter_price: "Proposed value",
      approval_link: "CUSTOMER APPROVAL LINK",
      system_name: "brcprint – Sua impressão 3D",
      footer_generated: "generated on",
      tax: "Taxes",
      shipping: "Shipping",
      cashback: "Cashback Applied",
      total_order: "ORDER TOTAL",
      of: "of",
      per_unit: "per unit",
      awaiting_payment: "AWAITING PAYMENT",
    },
    es: {
      title: "PRESUPUESTO",
      issued: "Emitido el",
      valid: "Válido hasta",
      approved: "✓ APROBADO",
      client: "Cliente",
      name: "Nombre",
      company: "Empresa",
      email: "Email",
      phone: "Teléfono",
      details: "Detalles de Impresión",
      description: "Descripción",
      printer: "Impresora",
      filament: "Filamento",
      time: "Tiempo de impresión",
      weight: "Material utilizado",
      setup: "Tiempo de setup",
      post: "Post-procesamiento",
      qty: "Cantidad",
      unit: "pieza(s)",
      composition: "Desglose de Costos",
      hours: "Horas de impresión",
      material: "Material utilizado",
      energy: "Energía eléctrica",
      labor: "Mano de obra",
      extras: "Productos y Servicios Extras",
      subtotal_extras: "Subtotal extras",
      final_label: "Precio Final por Unidad",
      lot: "Lote",
      counter_title: "CONTRAPROPUESTA DEL CLIENTE",
      counter_price: "Valor propuesto",
      approval_link: "LINK DE APROBACIÓN DEL CLIENTE",
      system_name: "brcprint – Sua impressão 3D",
      footer_generated: "generado el",
      tax: "Impuestos",
      shipping: "Envío",
      cashback: "Cashback Aplicado",
      total_order: "TOTAL DEL PEDIDO",
      of: "de",
      per_unit: "por unidad",
      awaiting_payment: "ESPERANDO PAGO",
    }
  };
  return dicts[lang] || dicts.pt;
};

const formatCurrency = (v: number, lang: string, code: string, symbol: string) => {
  try {
    return Number(v).toLocaleString(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US", {
      style: "currency",
      currency: code
    });
  } catch {
    return `${symbol} ${Number(v).toFixed(2)}`;
  }
};

function QuotePDF({ q, baseUrl, qrCodeUrl, config, lang, logoBase64 }: { q: any; baseUrl: string; qrCodeUrl?: string, config: any, lang: string, logoBase64?: string }) {
  const portalUrl = `${baseUrl}/portal/${q.public_token}`;
  const L = getLocales(lang);
  const currencyCode = config.currency_code || "BRL";
  const currencySymbol = config.currency_symbol || "R$";
  const taxPct = Number(config.default_tax_pct || 0);

  const fmt = (v: number) => formatCurrency(v, lang, currencyCode, currencySymbol);

  const currentShippingCost = Number(q.shipping_cost || 0);
  const shippingCost = currentShippingCost; // Alias for JSX compatibility
  const creditsUsed = Number(q.credits_used || 0);
  const basePrice = Number(q.final_price || 0) - currentShippingCost;
  const subtotalWithShipping = basePrice + currentShippingCost;
  const taxAmount = (subtotalWithShipping * taxPct) / 100;
  const totalPriceWithTax = Math.max(0, subtotalWithShipping + taxAmount - creditsUsed);
  const unitPriceWithTax = totalPriceWithTax / Number(q.quantity || 1);

  return (
    <Document title={`${L.title} #${q.id} – brcrint`} author="brcprint">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {logoBase64 ? (
              <Image src={logoBase64} style={{ width: 120, height: 32, marginRight: 15, objectFit: 'contain' }} />
            ) : (
              <Text style={styles.logo}>brcprint</Text>
            )}
            <View>
              <Text style={styles.logoSub}>{L.system_name}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>{L.title} #{q.id}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 8 }}>{L.issued} {new Date(q.created_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US')}</Text>
            {q.valid_until && (
              <Text style={{ color: "#22c55e", fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                {L.valid} {new Date(q.valid_until).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US')}
              </Text>
            )}
            {q.status && q.status !== "pending" && (
              <Text style={styles.statusBadge}>
                {q.status === "approved" ? L.approved : (L[q.status] || q.status.toUpperCase())}
              </Text>
            )}
          </View>
        </View>

        {/* Client */}
        {q.client_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.client}</Text>
            <View style={styles.row}><Text style={styles.label}>{L.name}</Text><Text style={styles.value}>{q.client_name}</Text></View>
            {q.client_company && <View style={styles.row}><Text style={styles.label}>{L.company}</Text><Text style={styles.value}>{q.client_company}</Text></View>}
            {q.client_email && <View style={styles.row}><Text style={styles.label}>{L.email}</Text><Text style={styles.value}>{q.client_email}</Text></View>}
            {q.client_phone && <View style={styles.row}><Text style={styles.label}>{L.phone}</Text><Text style={styles.value}>{q.client_phone}</Text></View>}
          </View>
        )}

        {/* Print details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L.details}</Text>
          {q.title && <View style={styles.row}><Text style={styles.label}>{L.description}</Text><Text style={styles.value}>{q.title}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>{L.printer}</Text><Text style={styles.value}>{q.printer_name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>{L.filament}</Text><Text style={styles.value}>{q.filament_name} ({q.filament_type}) - {q.filament_color || "N/A"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>{L.time}</Text><Text style={styles.value}>{q.print_time_hours}h</Text></View>
          <View style={styles.row}><Text style={styles.label}>{L.weight}</Text><Text style={styles.value}>{q.filament_used_g}g</Text></View>
          <View style={styles.row}><Text style={styles.label}>{L.setup}</Text><Text style={styles.value}>{q.setup_time_hours}h</Text></View>
          {Number(q.post_process_hours) > 0 && <View style={styles.row}><Text style={styles.label}>{L.post}</Text><Text style={styles.value}>{q.post_process_hours}h</Text></View>}
          <View style={styles.row}><Text style={styles.label}>{L.qty}</Text><Text style={styles.value}>{q.quantity} {L.unit}</Text></View>
        </View>

        {/* Cost breakdown — client view (matches portal) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L.composition}</Text>
          <View style={styles.row}><Text style={styles.label}>{L.hours}</Text><Text style={styles.value}>{q.print_time_hours}h</Text></View>
          <View style={styles.row}><Text style={styles.label}>{L.material}</Text><Text style={styles.value}>{q.filament_used_g}g {L.of} {q.filament_name} ({q.filament_type})</Text></View>
          <View style={styles.row}><Text style={styles.label}>{L.energy}</Text><Text style={styles.value}>{fmt(q.cost_energy)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>{L.labor}</Text><Text style={styles.value}>{fmt(q.cost_labor)}</Text></View>
          {q.extras && q.extras.length > 0 && (
            <>
              <View style={{ borderTop: "1px solid #e2e8f0", marginTop: 4, marginBottom: 4 } as any} />
              <Text style={{ ...styles.sectionTitle, fontSize: 8, marginBottom: 4 }}>{L.extras}</Text>
              {JSON.parse(q.extras).map((ex: any, i: number) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.label}>{ex.name} x {ex.quantity}</Text>
                  <Text style={styles.value}>{fmt(Number(ex.price_applied || ex.price) * Number(ex.quantity))}</Text>
                </View>
              ))}
              <View style={styles.row}>
                <Text style={{ ...styles.label, color: "#3c5077" }}>{L.subtotal_extras}</Text>
                <Text style={{ ...styles.value, color: "#3c5077" }}>+ {fmt(q.extras_total)}</Text>
              </View>
            </>
          )}
          {(shippingCost > 0 || q.shipping_service === 'Retirada em Mãos') && (
            <View style={styles.row}>
              <Text style={{ ...styles.label }}>
                {L.shipping} ({q.shipping_service || L.shipping})
                {q.shipping_service === 'Retirada em Mãos' && config.company_address && (
                  <Text style={{ fontSize: 7, color: "#94a3b8" }}>
                    {"\n"}Endereço: {config.company_address}{config.company_number ? `, ${config.company_number}` : ''}
                    {config.company_complement ? ` - ${config.company_complement}` : ''}
                    {config.company_neighborhood ? `, ${config.company_neighborhood}` : ''}
                    , {config.company_city} - {config.company_state}
                  </Text>
                )}
              </Text>
              <Text style={{ ...styles.value }}>+ {fmt(shippingCost)}</Text>
            </View>
          )}
          {taxPct > 0 && (
            <View style={styles.row}>
              <Text style={{ ...styles.label, color: "#94a3b8" }}>{L.tax} ({taxPct}%)</Text>
              <Text style={{ ...styles.value, color: "#94a3b8" }}>+ {fmt(taxAmount)}</Text>
            </View>
          )}
          {creditsUsed > 0 && (
            <View style={styles.row}>
              <Text style={{ ...styles.label, color: "#3c5077", fontFamily: "Helvetica-Bold" }}>{L.cashback}</Text>
              <Text style={{ ...styles.value, color: "#3c5077" }}>- {fmt(creditsUsed)}</Text>
            </View>
          )}
        </View>

        {/* Final price section - Highlight TOTAL ORDER */}
        <View style={styles.finalBox}>
          <Text style={styles.finalLabel}>{L.total_order}</Text>
          <Text style={styles.finalValue}>{fmt(totalPriceWithTax)}</Text>
          <Text style={styles.subValue}>
            {L.final_label}: {fmt(unitPriceWithTax)} {q.quantity > 1 ? `(${q.quantity} ${L.unit})` : ''}
          </Text>
        </View>

        {/* Counter offer */}
        {q.status === "counter_offer" && (
          <View style={{ ...styles.portalBox, marginTop: 10 }}>
            <Text style={{ ...styles.portalLabel, color: "#f59e0b" }}>{L.counter_title}</Text>
            <Text style={styles.portalLink}>{L.counter_price}: {fmt(q.counter_offer_price)} {L.per_unit}</Text>
            {q.counter_offer_notes && <Text style={{ ...styles.portalLink, marginTop: 2 }}>{q.counter_offer_notes}</Text>}
          </View>
        )}

        {/* Portal link */}
        <View style={styles.portalBox}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.portalLabel}>{L.approval_link}</Text>
              <Text style={styles.portalLink}>{portalUrl}</Text>
            </View>
            {qrCodeUrl && <Image src={qrCodeUrl} style={{ width: 60, height: 60, marginLeft: 10 }} />}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{L.system_name}</Text>
          <Text style={styles.footerText}>{L.title} #{q.id} {L.footer_generated} {new Date().toLocaleString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US')}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    const [rows] = await pool.query(
      `SELECT q.*, p.name AS printer_name, p.model AS printer_model,
              f.name AS filament_name, f.type AS filament_type, f.color AS filament_color,
              c.name AS client_name, c.company AS client_company,
              c.email AS client_email, c.phone AS client_phone,
              q.shipping_cost, q.credits_used
       FROM quotes q
       JOIN printers p ON q.printer_id = p.id
       JOIN filaments f ON q.filament_id = f.id
       LEFT JOIN clients c ON q.client_id = c.id
       WHERE q.id = ?`,
      [id]
    );
    const q = (rows as any[])[0];
    if (!q) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    // If token provided, validate it (for public access)
    if (token && q.public_token !== token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    }

    // Fetch global config
    const [configRows] = await pool.query("SELECT * FROM business_config WHERE id = 1");
    const config = (configRows as any[])[0] || {};

    const lang = searchParams.get("lang") || config.language_default || "pt";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let qrDataUrl = "";
    if (q.public_token) {
      try {
        qrDataUrl = await QRCode.toDataURL(`${baseUrl}/portal/${q.public_token}`, { margin: 1, width: 80 });
      } catch (e) { console.error("QR Error", e); }
    }

    // Load logo as base64
    let logoBase64 = "";
    try {
      const fs = require('fs');
      const path = require('path');
      const possiblePaths = [
        path.join(process.cwd(), 'brcprint.png'),
        path.join(process.cwd(), 'public', 'brcprint.png'),
        '/app/brcprint.png',
        '/app/public/brcprint.png'
      ];
      let logoPath = "";
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          logoPath = p;
          break;
        }
      }
      if (logoPath) {
        const logoData = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
      }
    } catch (e) {
      console.error("Logo Error", e);
    }

    const buffer = await renderToBuffer(<QuotePDF q={q} baseUrl={baseUrl} qrCodeUrl={qrDataUrl} config={config} lang={lang} logoBase64={logoBase64} />);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cotacao-${q.id}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
