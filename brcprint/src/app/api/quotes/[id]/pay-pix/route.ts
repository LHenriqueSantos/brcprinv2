import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { MercadoPagoConfig, Payment } from 'mercadopago';

// O SDK agora será instanciado dentro do request usando chaves do banco de dados (business_config)

/**
 * Ensures the base64 QR code string always has a proper data URI prefix.
 * MercadoPago returns raw base64; browsers need `data:image/png;base64,` prefix.
 */
function normalizeQrBase64(raw: string | null | undefined): string {
  if (!raw) return "";
  if (raw.startsWith("data:")) return raw;   // already a data URI
  if (raw.startsWith("http")) return raw;    // already a URL (mock mode)
  return `data:image/png;base64,${raw}`;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // 1. Validate Quote exists and is approved, and fetch business config
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

    // O PIX só pode ser gerado se a cotação estiver aprovada ou aguardando pagamento
    if (!["approved", "awaiting_payment"].includes(quote.status)) {
      return NextResponse.json(
        { error: `Status inválido para pagamento: ${quote.status}` },
        { status: 400 }
      );
    }

    // Se já geramos o PIX anteriormente, basta retornar o que está no banco para não gerar lixo na API do MP
    if (quote.pix_qr_code && quote.pix_qr_code_base64 && quote.mp_payment_id && quote.payment_method === 'pix') {
      return NextResponse.json({
        success: true,
        qr_code: quote.pix_qr_code,
        qr_code_base64: normalizeQrBase64(quote.pix_qr_code_base64),
        payment_id: quote.mp_payment_id
      });
    }

    if (!config.enable_mercadopago) {
      return NextResponse.json({ error: "O pagamento via PIX não está habilitado no sistema." }, { status: 400 });
    }

    const dbAccessToken = (config.mp_access_token || "").trim();
    const envAccessToken = (process.env.MP_ACCESS_TOKEN || "").trim();

    // Choose the best token available, ignoring placeholders and empty strings
    let mpAccessToken = 'TEST-MOCK-TOKEN';
    let tokenSource = 'FALLBACK-MOCK';

    if (dbAccessToken !== "" && !dbAccessToken.includes('YOUR_ACCESS_TOKEN_HERE')) {
      mpAccessToken = dbAccessToken;
      tokenSource = 'DATABASE';
    } else if (envAccessToken !== "" && !envAccessToken.includes('YOUR_ACCESS_TOKEN_HERE')) {
      mpAccessToken = envAccessToken;
      tokenSource = 'ENV-FILE';
    }

    console.log(`[MercadoPago] Token source: ${tokenSource} | Token prefix: ${mpAccessToken.substring(0, 8)}...`);

    // 2. Fallback local (Development/Mock mode) if no real/valid token configured
    const isMock = mpAccessToken.startsWith('TEST-') || mpAccessToken.includes('YOUR_ACCESS_TOKEN_HERE') || mpAccessToken === 'TEST-MOCK-TOKEN';
    if (isMock) {
      console.log("[MercadoPago MOCK] Generating fake PIX data. Mock mode is ACTIVE.");
      const fakeQr = "00020101021243650016COM.BRCPRINT.MOCK520400005303986540510.005802BR5908BRCPRINT6009SAO PAULO62070503***63045E0B";
      const fakeBase64 = "https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=" + encodeURIComponent(fakeQr);
      const fakePaymentId = Math.floor(Math.random() * 1000000000);

      await pool.query(
        "UPDATE quotes SET payment_method = 'pix', mp_payment_id = ?, pix_qr_code = ?, pix_qr_code_base64 = ? WHERE id = ?",
        [fakePaymentId, fakeQr, fakeBase64, id]
      );

      return NextResponse.json({
        success: true,
        qr_code: fakeQr,
        qr_code_base64: normalizeQrBase64(fakeBase64),
        payment_id: fakePaymentId,
        mock: true
      });
    }

    // 3. Real MercadoPago API Call
    const client = new MercadoPagoConfig({ accessToken: mpAccessToken, options: { timeout: 5000 } });
    const payment = new Payment(client);

    // We construct the full domain for the webhook notification URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sua-loja.com.br';

    // Cashback Deduction Logic
    let finalAmount = Number(quote.final_price);
    let appliedCashback = 0;

    if (config.enable_cashback && quote.client_id && Number(quote.credit_balance) > 0) {
      appliedCashback = Math.min(Number(quote.credit_balance), finalAmount);
      // Min value logic to prevent zero/negative transaction amount
      if (finalAmount - appliedCashback <= 0) {
        appliedCashback = finalAmount - 1;
      }
      finalAmount -= appliedCashback;

      // Deduct from client's wallet immediately
      if (appliedCashback > 0) {
        await pool.query("UPDATE clients SET credit_balance = credit_balance - ? WHERE id = ?", [appliedCashback, quote.client_id]);
      }
    }

    const requestData = {
      transaction_amount: finalAmount,
      description: `Pedido BRCPrint #${quote.id}`,
      payment_method_id: 'pix',
      payer: {
        email: quote.client_email || 'contato@brcprint.com',
        first_name: quote.client_name?.split(' ')[0] || 'Cliente',
        last_name: quote.client_name?.split(' ').slice(1).join(' ') || ''
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`
    };

    const response = await payment.create({ body: requestData });

    if (!response.point_of_interaction?.transaction_data) {
      throw new Error("MercadoPago API did not return PIX data");
    }

    const qrCode = response.point_of_interaction.transaction_data.qr_code;
    const qrCodeBase64 = normalizeQrBase64(response.point_of_interaction.transaction_data.qr_code_base64 as string);
    const paymentId = response.id;

    // 4. Save to Database (normalized to always include the data URI prefix)
    await pool.query(
      "UPDATE quotes SET payment_method = 'pix', mp_payment_id = ?, pix_qr_code = ?, pix_qr_code_base64 = ?, credits_used = ? WHERE id = ?",
      [paymentId, qrCode, qrCodeBase64, appliedCashback, id]
    );

    return NextResponse.json({
      success: true,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      payment_id: paymentId
    });

  } catch (error: any) {
    console.error("Erro ao gerar PIX:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao gerar PIX" }, { status: 500 });
  }
}
