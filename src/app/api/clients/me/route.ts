import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "cliente") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const clientId = (session.user as any).id;

    // Load client, their current subscription plan, and active status
    const [cRows] = await pool.query(
      `SELECT c.id, c.name, c.email, c.company, c.available_hours_balance, c.available_grams_balance, c.credit_balance, c.total_cashback_earned, c.subscription_status,
      p.name as plan_name, p.hours_included,
      IFNULL(b.balance, 0) as bids_balance
       FROM clients c
       LEFT JOIN subscription_plans p ON c.subscription_plan_id = p.id
       LEFT JOIN client_bids_balance b ON c.id = b.client_id
       WHERE c.id = ?`,
      [clientId]
    );

    const client = (cRows as any[])[0];
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "cliente") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const body = await req.json();
    const { name, company, phone, document, zipcode, address, address_number, address_comp, neighborhood, city, state } = body;

    await pool.query(
      `UPDATE clients SET
        name = ?, company = ?, phone = ?, document = ?,
        zipcode = ?, address = ?, address_number = ?, address_comp = ?,
        neighborhood = ?, city = ?, state = ?
       WHERE id = ?`,
      [
        name, company || null, phone || null, document || null,
        zipcode || null, address || null, address_number || null, address_comp || null,
        neighborhood || null, city || null, state || null,
        clientId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
