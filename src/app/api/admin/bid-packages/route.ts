import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const packages = await query("SELECT * FROM bid_packages ORDER BY price ASC");
    return NextResponse.json(packages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const { name, price, bids_amount } = await req.json();

    if (!name || !price || !bids_amount) {
      return NextResponse.json({ error: "Nome, preço e quantia de lances são obrigatórios." }, { status: 400 });
    }

    const result: any = await query(
      "INSERT INTO bid_packages (name, price, bids_amount) VALUES (?, ?, ?)",
      [name, price, bids_amount]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
