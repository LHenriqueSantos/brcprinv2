import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // 1. Validate Quote and fetch business config
    const [qRows] = await pool.query(
      "SELECT q.*, c.name as client_name, c.email as client_email, c.credit_balance FROM quotes q LEFT JOIN clients c ON q.client_id = c.id WHERE q.id = ?",
      [id]
    );
    const [configRows] = await pool.query("SELECT * FROM business_config WHERE id = 1");
    const config = (configRows as any[])[0] || {};

    const quotes = qRows as any[];
    if (quotes.length === 0) {
      return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    }

    const quote = quotes[0];

    // O pagamento só pode ser iniciado se a cotação estiver aprovada ou aguardando pagamento
    if (!["approved", "awaiting_payment"].includes(quote.status)) {
      return NextResponse.json(
        { error: `Status inválido para pagamento: ${quote.status}` },
        { status: 400 }
      );
    }

    if (!config.enable_mercadopago) {
      return NextResponse.json({ error: "O pagamento via Mercado Pago não está habilitado no sistema." }, { status: 400 });
    }

    const dbAccessToken = (config.mp_access_token || "").trim();
    const envAccessToken = (process.env.MP_ACCESS_TOKEN || "").trim();

    let mpAccessToken = 'TEST-MOCK-TOKEN';
    if (dbAccessToken !== "" && !dbAccessToken.includes('YOUR_ACCESS_TOKEN_HERE')) {
      mpAccessToken = dbAccessToken;
    } else if (envAccessToken !== "" && !envAccessToken.includes('YOUR_ACCESS_TOKEN_HERE')) {
      mpAccessToken = envAccessToken;
    }

    const isMock = mpAccessToken.startsWith('TEST-') || mpAccessToken.includes('YOUR_ACCESS_TOKEN_HERE') || mpAccessToken === 'TEST-MOCK-TOKEN';

    if (isMock) {
      // Return a fake URL for development
      return NextResponse.json({
        success: true,
        init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_pref_id",
        mock: true
      });
    }

    const client = new MercadoPagoConfig({ accessToken: mpAccessToken, options: { timeout: 5000 } });
    const preference = new Preference(client);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Cashback Deduction Logic
    let finalAmount = Number(quote.final_price);
    let appliedCashback = 0;

    if (config.enable_cashback && quote.client_id && Number(quote.credit_balance) > 0) {
      appliedCashback = Math.min(Number(quote.credit_balance), finalAmount);
      if (finalAmount - appliedCashback <= 0) {
        appliedCashback = finalAmount - 1;
      }
      finalAmount -= appliedCashback;
    }

    const preferenceData = {
      body: {
        items: [
          {
            id: quote.id.toString(),
            title: `Pedido BRCPrint #${quote.id}`,
            quantity: 1,
            unit_price: finalAmount,
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: quote.client_email || 'contato@brcprint.com',
          name: quote.client_name || 'Cliente',
        },
        backUrls: {
          success: `${baseUrl}/portal/${quote.public_token}?payment=success`,
          failure: `${baseUrl}/portal/${quote.public_token}?payment=failure`,
          pending: `${baseUrl}/portal/${quote.public_token}?payment=pending`,
        },
        autoReturn: 'approved' as const,
        notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
        externalReference: quote.id.toString(),
      }
    };

    const response = await preference.create(preferenceData);

    return NextResponse.json({
      success: true,
      init_point: response.init_point,
      preference_id: response.id
    });

  } catch (error: any) {
    console.error("Erro ao gerar Preferência de Pagamento:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao processar pagamento" }, { status: 500 });
  }
}
