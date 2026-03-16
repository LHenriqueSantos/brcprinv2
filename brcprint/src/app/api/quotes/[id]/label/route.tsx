import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// 100x150mm em pontos (approx 283.46 x 425.20)
const PAGE_WIDTH = 283.46;
const PAGE_HEIGHT = 425.20;

const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#000000",
    backgroundColor: "#ffffff",
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "2px solid #000",
    paddingBottom: 8,
    marginBottom: 10,
    alignItems: "center"
  },
  logo: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  orderText: { fontSize: 12, fontFamily: "Helvetica-Bold" },

  section: {
    marginBottom: 12,
    padding: 6,
    border: "1px solid #000",
    borderRadius: 4
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
    borderBottom: "1px dashed #ccc",
    paddingBottom: 2
  },

  textBold: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 },
  textNormal: { fontSize: 9, marginBottom: 2 },

  qrContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  qrCode: { width: 60, height: 60, marginRight: 10 },
  qrText: { fontSize: 8, flex: 1 },

  checklistContainer: {
    marginTop: 5,
    borderTop: "2px solid #000",
    paddingTop: 8
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    borderBottom: "1px solid #eee",
    paddingBottom: 4
  },
  checkboxBox: {
    width: 12,
    height: 12,
    border: "1px solid #000",
    marginRight: 6
  },
  itemDetails: {
    flex: 1
  },
  itemName: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  itemSpecs: { fontSize: 7, color: "#333" },
  itemQty: { fontSize: 10, fontFamily: "Helvetica-Bold", width: 20, textAlign: "right" },

  // Content Declaration specific styles
  declTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 10, textDecoration: "underline" },
  declBox: { border: "1px solid #000", padding: 6, marginBottom: 8 },
  declRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  declLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  declValue: { fontSize: 8 },

  tableHeader: { flexDirection: "row", borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 4 },
  colName: { flex: 3, fontSize: 8, fontFamily: "Helvetica-Bold" },
  colQty: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "center" },
  colPrice: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right" },
  colTotal: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right" },

  tableRow: { flexDirection: "row", marginBottom: 4 },
  cellName: { flex: 3, fontSize: 8 },
  cellQty: { flex: 1, fontSize: 8, textAlign: "center" },
  cellPrice: { flex: 1, fontSize: 8, textAlign: "right" },
  cellTotal: { flex: 1, fontSize: 8, textAlign: "right" },

  signatureBox: { marginTop: 20, alignItems: "center" },
  signatureLine: { width: "80%", borderBottom: "1px solid #000", marginBottom: 4 },
  signatureText: { fontSize: 8 },
  legalText: { fontSize: 6, textAlign: "justify", marginTop: 10, color: "#333" }
});

function ThermalLabelPDF({ q, qrCodeUrl, config }: { q: any; qrCodeUrl?: string, config: any }) {
  let items = [];
  try {
    items = typeof q.items === 'string' ? JSON.parse(q.items) : (q.items || []);
  } catch (e) {
    console.error("Failed to parse items for label", e);
  }

  // Fallback to old schema if no items array exists
  if (items.length === 0 && q.title) {
    items.push({
      name: q.title,
      quantity: q.quantity || 1,
      material: `${q.filament_name} ${q.filament_type} - ${q.filament_color || "N/A"}`
    });
  }

  return (
    <Document title={`Etiqueta - Pedido #${q.id}`} author="BRCPrint">
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>{config.company_name || 'BRCPrint'}</Text>
          <Text style={styles.orderText}>PEDIDO #{q.id}</Text>
        </View>

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESTINATÁRIO</Text>
          <Text style={styles.textBold}>{q.client_name || 'Cliente Avulso'}</Text>
          {(q.client_phone) && <Text style={styles.textNormal}>TEL: {q.client_phone}</Text>}
          {(q.client_zipcode) && <Text style={styles.textNormal}>CEP: {q.client_zipcode}</Text>}
          {(q.shipping_service || q.shipping_cost > 0) && (
            <Text style={{ ...styles.textBold, marginTop: 4 }}>
              ENVIO: {q.shipping_service ? q.shipping_service.toUpperCase() : 'Padrão'}
            </Text>
          )}
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          {qrCodeUrl && <Image src={qrCodeUrl} style={styles.qrCode} />}
          <Text style={styles.qrText}>
            Acesse o portal para ver detalhes do status, nota fiscal e rastreamento.
          </Text>
        </View>

        {/* Checklist */}
        <View style={styles.checklistContainer}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 6, textAlign: "center" }}>
            CONFERÊNCIA DE PACOTE
          </Text>

          {items.map((item: any, idx: number) => (
            <View key={idx} style={styles.checklistItem}>
              <View style={styles.checkboxBox}></View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSpecs}>{item.material || 'Material Padrão'} {item.color ? `| ${item.color}` : ''}</Text>
              </View>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
            </View>
          ))}
        </View>

        <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
          <Text style={{ fontSize: 7, color: '#666' }}>Gerado por BRCPrint OS - Página 1/2</Text>
        </View>

      </Page>

      {/* Page 2: Declaração de Conteúdo */}
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        <Text style={styles.declTitle}>DECLARAÇÃO DE CONTEÚDO</Text>

        <View style={styles.declBox}>
          <Text style={styles.sectionTitle}>REMETENTE</Text>
          <View style={styles.declRow}><Text style={styles.declLabel}>Nome:</Text><Text style={styles.declValue}>{config.company_name || 'BRCPrint'}</Text></View>
          <View style={styles.declRow}><Text style={styles.declLabel}>Endereço:</Text><Text style={styles.declValue}>Remetente Padrão (Isento)</Text></View>
        </View>

        <View style={styles.declBox}>
          <Text style={styles.sectionTitle}>DESTINATÁRIO</Text>
          <View style={styles.declRow}><Text style={styles.declLabel}>Nome:</Text><Text style={styles.declValue}>{q.client_name || 'Cliente Avulso'}</Text></View>
          {q.client_phone && <View style={styles.declRow}><Text style={styles.declLabel}>Telefone:</Text><Text style={styles.declValue}>{q.client_phone}</Text></View>}
          {q.client_zipcode && <View style={styles.declRow}><Text style={styles.declLabel}>CEP:</Text><Text style={styles.declValue}>{q.client_zipcode}</Text></View>}
        </View>

        <View style={styles.declBox}>
          <Text style={styles.sectionTitle}>ITENS DO ENVIO</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colName}>Descrição</Text>
            <Text style={styles.colQty}>Qtd</Text>
            <Text style={styles.colTotal}>Valor</Text>
          </View>

          {items.map((item: any, idx: number) => {
            // Rough estimate of item value if not explicitly set
            const itemValue = item.price_applied || (Number(q.final_price) / (items.reduce((acc: any, i: any) => acc + (i.quantity || 1), 0))) * (item.quantity || 1);
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.cellName}>{item.name}</Text>
                <Text style={styles.cellQty}>{item.quantity}</Text>
                <Text style={styles.cellTotal}>R$ {Number(itemValue).toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.declLabel}>VALOR TOTAL:</Text>
            <Text style={styles.declLabel}>R$ {Number(q.final_price).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.legalText}>
          Declaro que não me enquadro no conceito de contribuinte previsto no art. 4º da Lei Complementar nº 87/1996, uma vez que não realizo, com habitualidade ou em volume que caracterize intuito comercial, operações de circulação de mercadoria, ainda que se iniciem no exterior, ou estou dispensado da emissão da nota fiscal por força da legislação tributária vigente, responsabilizando-me, nos termos da lei e a quem de direito, por informações inverídicas.
        </Text>

        <View style={styles.signatureBox}>
          <View style={styles.signatureLine}></View>
          <Text style={styles.signatureText}>Assinatura do Remetente</Text>
          <Text style={{ fontSize: 7, marginTop: 4 }}>Data: ___/___/20__</Text>
        </View>

        <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
          <Text style={{ fontSize: 7, color: '#666' }}>Página 2/2</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas administradores podem gerar etiquetas de despacho." }, { status: 403 });
    }

    const { id } = await context.params;

    const [rows] = await pool.query(
      `SELECT q.*, p.name AS printer_name,
              f.name AS filament_name, f.type AS filament_type, f.color AS filament_color,
              c.name AS client_name, c.company AS client_company,
              c.phone AS client_phone
       FROM quotes q
       LEFT JOIN printers p ON q.printer_id = p.id
       LEFT JOIN filaments f ON q.filament_id = f.id
       LEFT JOIN clients c ON q.client_id = c.id
       WHERE q.id = ?`,
      [id]
    );
    const q = (rows as any[])[0];
    if (!q) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    // Fetch config safely
    const [configRows] = await pool.query("SELECT id FROM business_config WHERE id = 1");
    const config = (configRows as any[])[0] || {};
    const companyName = process.env.NEXT_PUBLIC_APP_NAME || "BRC Print 3D";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let qrDataUrl = "";
    if (q.public_token) {
      try {
        qrDataUrl = await QRCode.toDataURL(`${baseUrl}/portal/${q.public_token}`, { margin: 0, width: 80, color: { dark: '#000000', light: '#ffffff' } });
      } catch (e) { console.error("QR Error", e); }
    }

    // Inject companyName into config for the PDF component
    config.company_name = companyName;

    const buffer = await renderToBuffer(<ThermalLabelPDF q={q} qrCodeUrl={qrDataUrl} config={config} />);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="etiqueta-${q.id}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Label Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
