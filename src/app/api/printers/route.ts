import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM printers ORDER BY name");
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, model, type, power_watts, purchase_price, lifespan_hours,
      maintenance_reserve_pct, maintenance_alert_threshold,
      api_type, ip_address, api_key, device_serial
    } = body;
    const [result] = await pool.query(
      `INSERT INTO printers (name, model, type, power_watts, purchase_price, lifespan_hours, maintenance_reserve_pct, maintenance_alert_threshold, api_type, ip_address, api_key, device_serial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, model, type || 'FDM', power_watts, purchase_price, lifespan_hours || 2000,
        maintenance_reserve_pct || 5, maintenance_alert_threshold || 200,
        api_type || 'none', ip_address || null, api_key || null, device_serial || null
      ]
    );
    const id = (result as any).insertId;
    const [rows] = await pool.query("SELECT * FROM printers WHERE id = ?", [id]);
    return NextResponse.json((rows as any[])[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
