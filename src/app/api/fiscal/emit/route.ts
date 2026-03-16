import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
});

const getApiUrl = (env: string, type: string) => {
  const base = env === 'production' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
  return `${base}/v2/${type}?ref=`;
};

export async function POST(req: Request) {
  try {
    const { quoteId } = await req.json();

    if (!quoteId) return NextResponse.json({ error: "Quote ID is required" }, { status: 400 });

    const [configRows]: any = await pool.query("SELECT focusnfe_token, focusnfe_environment, default_nfe_type FROM business_config WHERE id = 1");
    if (!configRows.length || !configRows[0].focusnfe_token) {
      return NextResponse.json({ error: "Focus NFe token not configured" }, { status: 400 });
    }
    const token = configRows[0].focusnfe_token;
    const env = configRows[0].focusnfe_environment || 'sandbox';
    const type = configRows[0].default_nfe_type || 'nfse';

    const [quoteRows]: any = await pool.query(`
      SELECT q.*, c.name as client_name, c.document as client_doc, c.email as client_email, c.phone as client_phone
      FROM quotes q
      JOIN clients c ON q.client_id = c.id
      WHERE q.id = ?`, [quoteId]);

    if (!quoteRows.length) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    const quote = quoteRows[0];

    if (!quote.client_doc) {
      return NextResponse.json({ error: "O cliente não possui CPF ou CNPJ cadastrado, não é possível emitir NFe." }, { status: 400 });
    }

    const apiUrl = getApiUrl(env, type) + quote.id; // Unique reference for idempotency
    const authHeader = "Basic " + Buffer.from(token + ":").toString('base64');

    // Default Payload for NFS-e
    let payload: any = {
      data_emissao: new Date().toISOString(),
      prestador: { // Usually registered in Focus panel, but explicitly adding some fields can help
        cnpj: "00000000000000" // Should be updated in the Focus NFe panel directly
      },
      tomador: {
        cnpj_cpf: quote.client_doc.replace(/\D/g, ''),
        razao_social: quote.client_name,
        email: quote.client_email || "",
        telefone: quote.client_phone ? quote.client_phone.replace(/\D/g, '') : "",
        endereco: {
          logradouro: quote.client_address || "",
          numero: quote.client_number || "S/N",
          complemento: quote.client_complement || "",
          bairro: quote.client_neighborhood || "",
          codigo_municipio: "3550308", // IBGE Code - Em um cenário real, isso precisa ser mapeado pelo CEP. Fixo SP para POC.
          uf: quote.client_state?.substr(0, 2).toUpperCase() || "",
          cep: quote.client_zipcode?.replace(/\D/g, '') || ""
        }
      },
      servico: {
        aliquota: 3,
        discriminacao: `Serviço de Impressão 3D e Manufatura Aditiva. Referente à Cotação #${quote.id}.`,
        iss_retido: false,
        item_lista_servico: "14.06", // Instalação e montagem de aparelhos, máquinas e equipamentos... (Use o aplicável à sua prefeitura)
        codigo_tributario_municipio: "1406",
        valor_servicos: parseFloat(quote.final_price)
      }
    };

    if (type === 'nfe') {
      // NFe Product Payload goes here if desired
      payload = {
        natureza_operacao: "Venda de produto",
        data_emissao: new Date().toISOString(),
        destinatario: {
          cnpj_cpf: quote.client_doc.replace(/\D/g, ''),
          nome: quote.client_name,
          indicador_inscricao_estadual: "9",
          endereco: {
            // ... mapping for NF-e address
            logradouro: quote.client_address || "",
            numero: quote.client_number || "S/N",
            bairro: quote.client_neighborhood || "",
            uf: quote.client_state?.substr(0, 2).toUpperCase() || "",
            cep: quote.client_zipcode?.replace(/\D/g, '') || "",
            municipio: quote.client_city || ""
          }
        },
        itens: [
          {
            numero_item: 1,
            codigo_produto: "3D",
            descricao: `Peças Impressas 3D - Cotação #${quote.id}`,
            cfop: "5101",
            unidade_comercial: "UN",
            quantidade_comercial: quote.quantity || 1,
            valor_unitario_comercial: parseFloat(quote.final_price_per_unit) || parseFloat(quote.final_price),
            unidade_tributavel: "UN",
            quantidade_tributavel: quote.quantity || 1,
            valor_unitario_tributavel: parseFloat(quote.final_price_per_unit) || parseFloat(quote.final_price),
            origem: "0",
            icms_situacao_tributaria: "102"
          }
        ]
      };
    }

    const nfeRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // Update status to processing regardless of immediate return (unless completely failed API)
    if (!nfeRes.ok) {
      const err = await nfeRes.text();
      await pool.query("UPDATE quotes SET nfe_status = 'error' WHERE id = ?", [quoteId]);
      return NextResponse.json({ error: `Focus NFe Error: ${err}` }, { status: nfeRes.status });
    }

    const nfeData = await nfeRes.json();
    const status = nfeData.status || 'processando';

    await pool.query(
      "UPDATE quotes SET nfe_status = ? WHERE id = ?",
      [status, quoteId]
    );

    return NextResponse.json({ success: true, nfeData });

  } catch (error: any) {
    console.error("Focus NFe API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
