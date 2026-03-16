import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name, model, type, power_watts, purchase_price, lifespan_hours,
      maintenance_reserve_pct, active, maintenance_alert_threshold, current_hours_printed,
      api_type, ip_address, api_key, device_serial
    } = body;
    await pool.query(
      `UPDATE printers SET name=?, model=?, type=?, power_watts=?, purchase_price=?, lifespan_hours=?, maintenance_reserve_pct=?, maintenance_alert_threshold=?, current_hours_printed=COALESCE(?, current_hours_printed), active=?, api_type=?, ip_address=?, api_key=?, device_serial=? WHERE id=?`,
      [
        name, model, type || 'FDM', power_watts, purchase_price, lifespan_hours,
        maintenance_reserve_pct, maintenance_alert_threshold || 200, current_hours_printed, active ?? 1,
        api_type || 'none', ip_address || null, api_key || null, device_serial || null, id
      ]
    );
    const [rows] = await pool.query("SELECT * FROM printers WHERE id = ?", [id]);
    return NextResponse.json((rows as any[])[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query("UPDATE printers SET active = 0 WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
