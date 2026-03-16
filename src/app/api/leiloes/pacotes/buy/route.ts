import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { MercadoPagoConfig, Payment } from "mercadopago";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any) || !(session.user as any).id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const { packageId } = await req.json();

    if (!packageId) {
      return NextResponse.json({ error: "ID do pacote é obrigatório." }, { status: 400 });
    }

    // Busca o pacote de lances
    const [pkgRows]: any = await pool.query("SELECT * FROM bid_packages WHERE id = ?", [packageId]);
    if (pkgRows.length === 0) {
      return NextResponse.json({ error: "Pacote de lances não encontrado." }, { status: 404 });
    }
    const pkg = pkgRows[0];
    const price = parseFloat(pkg.price);

    // Registra a intenção de compra pendente
    const [result]: any = await pool.query(
      "INSERT INTO bid_purchases (client_id, package_id, price, bids_amount, status) VALUES (?, ?, ?, ?, 'pending')",
      [clientId, pkg.id, price, pkg.bids_amount]
    );
    const purchaseId = result.insertId;

    // Busca as credenciais do MercadoPago das Configurações Globais
    const [confRows]: any = await pool.query("SELECT * FROM business_config LIMIT 1");
    const config = confRows.length > 0 ? confRows[0] : {};

    if (!config.enable_mercadopago || !config.mp_access_token) {
      // Se MP não estiver configurado, podemos simular uma aprovação imediata para testes (ambiente de dev) ou rejeitar.
      return NextResponse.json({ error: "Método de pagamento MercadoPago inativo no sistema." }, { status: 500 });
    }

    const { mp_access_token } = config;

    // Chama o MercadoPago para gerar o QR Code
    const client = new MercadoPagoConfig({ accessToken: mp_access_token, options: { timeout: 5000 } });
    const payment = new Payment(client);

    // Forçamos o email fictício na req se não tiver
    const payerEmail = session?.user?.email || `cliente_${clientId}@brcprint.local`;

    const paymentBody = {
      transaction_amount: price,
      description: `BRCPrint - Pacote de ${pkg.bids_amount} Lances`,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
      },
      external_reference: `BIDPKG_${purchaseId}`
    };

    const response = await payment.create({ body: paymentBody });

    if (!response.point_of_interaction?.transaction_data?.qr_code_base64) {
      throw new Error("MercadoPago não retornou o pix/qrcode.");
    }

    return NextResponse.json({
      success: true,
      purchaseId,
      original_price: price,
      qr_code: response.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: "data:image/png;base64," + response.point_of_interaction.transaction_data.qr_code_base64,
    });

  } catch (error: any) {
    console.error("[Buy Bid Pkg] Erro ao gerar pagamento:", error);
    return NextResponse.json({ error: error.message || "Falha interna" }, { status: 500 });
  }
}
