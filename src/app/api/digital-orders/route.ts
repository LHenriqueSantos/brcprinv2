import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { catalog_item_id, client_name, client_email } = body;

    if (!catalog_item_id || !client_name || !client_email) {
      return NextResponse.json({ error: "Faltam campos obrigatórios." }, { status: 400 });
    }

    // Valida o catálogo
    const [items] = await pool.query(
      `SELECT id, is_digital_sale, digital_price, title FROM catalog_items WHERE id = ?`,
      [catalog_item_id]
    ) as any[];

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Item do catálogo não encontrado." }, { status: 404 });
    }

    const item = items[0];
    if (!item.is_digital_sale || Number(item.digital_price) <= 0) {
      return NextResponse.json({ error: "Este item não está disponível para venda digital." }, { status: 403 });
    }

    // Gera um token criptográfico único
    const downloadToken = crypto.randomBytes(32).toString('hex');

    // Gera o "PIX" (Nesta PoC, apenas uma string aleatória do banco Bradesco/Inter)
    const pixCode = `00020101021226580014br.gov.bcb.pix0136{chave-pix}520400005303986540${Number(item.digital_price).toFixed(2).replace('.', '')}5802BR5909BRCPRINT6009SAOPAULO62070503***6304${downloadToken.substring(0, 4).toUpperCase()}`;

    // Insere no banco com expiração de 24 horas a partir de criação
    // Usaremos MySQL DATE_ADD para somar 24 horas
    const price = Number(item.digital_price);

    const [result] = await pool.query(
      `INSERT INTO digital_orders (catalog_item_id, client_name, client_email, price, status, pix_code, pix_qr, download_token, expires_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [catalog_item_id, client_name, client_email, price, pixCode, null, downloadToken]
    ) as any[];

    const orderId = result.insertId;

    return NextResponse.json({
      id: orderId,
      pixCode,
      downloadToken,
      title: item.title,
      price: price
    }, { status: 201 });

  } catch (err: any) {
    console.error("Digital Order POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
