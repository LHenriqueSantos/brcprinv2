import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateCosts } from "@/lib/pricing";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id: quoteId } = await params;
    const body = await req.json();
    const { consumable_id, quantity_used } = body;

    if (!consumable_id || !quantity_used) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    // 1. Fetch the consumable
    const [cRows]: any = await pool.query("SELECT * FROM consumables WHERE id = ?", [consumable_id]);
    if (cRows.length === 0) return NextResponse.json({ error: "Insumo não encontrado" }, { status: 404 });
    const consumable = cRows[0];

    const costRecorded = Number(consumable.cost_per_unit) * Number(quantity_used);

    // Start a transaction? Or just serial queries
    // 2. Insert into quote_consumables
    await pool.query(
      "INSERT INTO quote_consumables (quote_id, consumable_id, quantity_used, cost_recorded) VALUES (?, ?, ?, ?)",
      [quoteId, consumable_id, quantity_used, costRecorded]
    );

    // 3. Subtract from stock
    const newStock = Number(consumable.stock_current) - Number(quantity_used);
    await pool.query("UPDATE consumables SET stock_current = ? WHERE id = ?", [newStock, consumable_id]);

    // 4. Fetch the quote to recalculate
    const [qRows]: any = await pool.query("SELECT * FROM quotes WHERE id = ?", [quoteId]);
    if (qRows.length > 0) {
      const q = qRows[0];

      // Calculate total consumable costs existing for this quote
      const [qcRows]: any = await pool.query("SELECT SUM(cost_recorded) as total_c_cost FROM quote_consumables WHERE quote_id = ?", [quoteId]);
      const totalConsumablesCost = Number(qcRows[0]?.total_c_cost || 0);

      // Recalculate using the pricing engine
      const paramsPricing = {
        print_time_hours: Number(q.print_time_hours),
        filament_used_g: Number(q.filament_used_g),
        setup_time_hours: Number(q.setup_time_hours),
        post_process_hours: Number(q.post_process_hours),
        quantity: Number(q.quantity),
        energy_kwh_price: Number(q.energy_kwh_price),
        labor_hourly_rate: Number(q.labor_hourly_rate),
        profit_margin_pct: Number(q.profit_margin_pct),
        loss_pct: Number(q.loss_pct),
        spare_parts_pct: Number(q.spare_parts_pct),
        power_watts: Number(q.config?.power_watts || 300),
        purchase_price: Number(q.config?.purchase_price || 3000),
        lifespan_hours: Number(q.config?.lifespan_hours || 4000),
        maintenance_reserve_pct: Number(q.config?.maintenance_reserve_pct || 15),
        cost_per_kg: Number(q.cost_filament / (Number(q.filament_used_g) / 1000) || 100), // Approximate
        packaging_cost: Number(q.packaging_cost || 0),
        consumables_cost: totalConsumablesCost
      };

      // wait, the config params are not stored separately, some are in quotes directly
      const pricing = calculateCosts({
        ...paramsPricing,
        // override cost_per_kg safely
        cost_per_kg: q.filament_used_g > 0 ? (Number(q.cost_filament) / (1 + Number(q.loss_pct) / 100)) / (Number(q.filament_used_g) / 1000) : 0,
        power_watts: q.power_watts || 300,
        purchase_price: q.purchase_price || 3000,
        lifespan_hours: q.lifespan_hours || 4000,
        maintenance_reserve_pct: q.maintenance_reserve_pct || 15
      });

      // Update the quote
      await pool.query(
        "UPDATE quotes SET cost_total_production = ?, profit_value = ?, final_price = ?, final_price_per_unit = ? WHERE id = ?",
        [pricing.cost_total_production, pricing.profit_value, pricing.final_price, pricing.final_price_per_unit, quoteId]
      );
    }

    return NextResponse.json({ success: true, added: { consumable, quantity: quantity_used, cost: costRecorded } });
  } catch (err: any) {
    console.error("Erro ao adicionar insumo à cotação:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [rows]: any = await pool.query(
      `SELECT qc.*, c.name, c.unit_type, c.category
       FROM quote_consumables qc
       JOIN consumables c ON qc.consumable_id = c.id
       WHERE qc.quote_id = ?`,
      [(await params).id]
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: "Erro ao buscar insumos da cotação" }, { status: 500 });
  }
}
