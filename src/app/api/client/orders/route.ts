import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !(session?.user as any).id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const client_id = (session.user as any).id;

    // 1. Fetch all quotes for this client
    // Joining with filaments to get material/color
    const [quotes]: any[] = await pool.query(
      `SELECT
        q.id,
        q.title,
        q.file_url,
        f.type as material_name,
        f.color as color_name,
        q.quantity,
        q.status,
        q.final_price,
        q.tax_amount,
        q.shipping_cost,
        q.created_at,
        q.public_token
       FROM quotes q
       LEFT JOIN filaments f ON q.filament_id = f.id
       WHERE q.client_id = ?
       ORDER BY q.created_at DESC`,
      [client_id]
    );

    // 2. Fetch all quote_requests for this client
    // Note: quote_requests table lacks 'title', 'material_preference', 'color_preference' based on previous check
    const [requests]: any[] = await pool.query(
      `SELECT
        id,
        title,
        file_urls,
        file_url,
        material_preference,
        color_preference,
        quantity,
        status,
        created_at,
        quote_id
       FROM quote_requests
       WHERE client_id = ?
       ORDER BY created_at DESC`,
      [client_id]
    );

    // 3. Normalize and combine
    const normalizedQuotes = quotes.map((q: any) => ({
      id: q.id,
      title: q.title || q.file_url?.split('/').pop() || "Pedido",
      file_url: q.file_url,
      public_token: q.public_token,
      material_preference: q.material_name,
      color_preference: q.color_name,
      quantity: q.quantity,
      status: q.status,
      final_price: q.final_price,
      tax_amount: q.tax_amount,
      shipping_cost: q.shipping_cost,
      created_at: q.created_at,
      source: 'quote'
    }));

    const normalizedRequests = requests.filter((r: any) => !r.quote_id).map((r: any) => ({
      id: r.id,
      title: r.title || r.file_url?.split('/').pop() || "Solicitação",
      file_url: r.file_url,
      public_token: null,
      material_preference: r.material_preference,
      color_preference: r.color_preference,
      quantity: r.quantity,
      status: r.status,
      final_price: null,
      tax_amount: null,
      shipping_cost: null,
      created_at: r.created_at,
      source: 'request'
    }));

    const combined = [...normalizedQuotes, ...normalizedRequests];

    // Sort by created_at descending
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(combined);
  } catch (err: any) {
    console.error("CRITICAL ERROR in /api/client/orders:", err);
    return NextResponse.json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
