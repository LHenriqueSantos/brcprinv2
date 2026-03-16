import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const [rows] = await pool.query(
      `SELECT d.status, d.expires_at, c.stl_file_url
       FROM digital_orders d
       JOIN catalog_items c ON d.catalog_item_id = c.id
       WHERE d.download_token = ?`,
      [token]
    ) as any[];

    if (!rows || rows.length === 0) {
      return new NextResponse(
        `<html><body><h1 style="color:red;font-family:sans-serif;text-align:center;margin-top:50px;">Acesso Negado</h1><p style="text-align:center;font-family:sans-serif;">Token inválido ou não encontrado.</p></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const order = rows[0];

    // Verifica Pagamento
    if (order.status !== 'paid') {
      return new NextResponse(
        `<html><body><h1 style="color:#f59e0b;font-family:sans-serif;text-align:center;margin-top:50px;">Aguardando Pagamento</h1><p style="text-align:center;font-family:sans-serif;">Este link será liberado assim que o pagamento for confirmado.</p></body></html>`,
        { status: 403, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Verifica Validade (Expirou?)
    const now = new Date();
    const expiresAt = new Date(order.expires_at);
    if (now > expiresAt) {
      return new NextResponse(
        `<html><body><h1 style="color:red;font-family:sans-serif;text-align:center;margin-top:50px;">Link Expirado</h1><p style="text-align:center;font-family:sans-serif;">O prazo de 24 horas para download deste arquivo expirou.</p></body></html>`,
        { status: 410, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Se estiver tudo certo, redirecionamos para a URL real do arquivo
    // Em um sistema S3 de produção, aqui faríamos um Signed URL do S3.
    // Como estamos servindo a URL direta do banco (geralmente localhost:3000/uploads/...), redirecionamos.
    return NextResponse.redirect(new URL(order.stl_file_url, req.url));

  } catch (err: any) {
    console.error("Download Digital Error:", err);
    return new NextResponse(`Erro interno ao processar o download.`, { status: 500 });
  }
}
