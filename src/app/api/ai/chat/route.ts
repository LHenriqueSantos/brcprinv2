import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAiResponse } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, quoteId, token } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 });
    }

    // 1. Fetch contextual info about the quote
    let quoteContext = "Nenhum dado de pedido vinculado no momento.";
    if (quoteId && token) {
      const [rows] = await pool.query(
        `SELECT q.*, f.name as mat_name, f.type as mat_type, f.description as mat_desc
         FROM quotes q
         LEFT JOIN filaments f ON q.filament_id = f.id
         WHERE q.id = ? AND q.public_token = ?`,
        [quoteId, token]
      );
      const q = (rows as any[])[0];

      if (q) {
        quoteContext = `
DETALHES DO PEDIDO ATUAL:
- ID do Pedido: #${q.id}
- Título: ${q.title || "Sem título"}
- Status: ${translateStatus(q.status)}
- Material Usado: ${q.mat_name} (${q.mat_type})
- Descrição do Material: ${q.mat_desc || "N/A"}
- Valor Total: ${q.final_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
- Prazo de Validade: ${new Date(q.valid_until).toLocaleDateString("pt-BR")}
- Notas do Admin: ${q.notes || "Nenhuma nota específica."}
`;
      }
    }

    // 2. Fetch general info about other materials for comparison
    const [filaments] = await pool.query("SELECT name, type FROM filaments WHERE active = 1");
    const [configRows] = await pool.query("SELECT ai_system_prompt FROM business_config WHERE id = 1");
    const aiPrompt = (configRows as any[])[0]?.ai_system_prompt || undefined;

    const filamentInfo = (filaments as any[]).map(f => `- ${f.name} (${f.type})`).join("\n");

    const fullContext = `
${quoteContext}

CATÁLOGO DE MATERIAIS DISPONÍVEIS:
${filamentInfo}

SOBRE A BRCPRINT:
- Somos especialistas em FDM e Resina.
- Oferecemos acabamentos de pintura e pós-processamento.
- Nosso prazo de entrega padrão após aprovação é de 7 a 15 dias úteis (dependendo da peça).
`;

    const aiText = await getAiResponse(messages, fullContext, aiPrompt);

    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function translateStatus(s: string) {
  const map: any = {
    pending: "Aguardando orçamentação ou revisão",
    quoted: "Aguardando aprovação do cliente (Orçado)",
    approved: "Aprovado / Aguardando início da produção",
    in_production: "Em produção no momento",
    finished: "Impressão finalizada / Aguardando envio",
    shipped: "Enviado ao cliente",
    rejected: "Recusado pelo cliente",
    counter_offer: "Contra-proposta pendente de análise"
  };
  return map[s] || s;
}
