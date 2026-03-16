import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await checkAdmin()) return forbiddenResponse();
  try {
    // 1. Revenue and Cost by Month (Last 12 months)
    const [revenueRows] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(final_price) as revenue,
        SUM(cost_total_production) as cost,
        SUM(profit_value) as profit
      FROM quotes
      WHERE status IN ('approved', 'in_production', 'delivered')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // 2. Material Usage (All time)
    const [materialRows] = await pool.query(`
      SELECT
        f.name as material_name,
        f.type as material_type,
        SUM(q.filament_used_g) as total_grams
      FROM quotes q
      JOIN filaments f ON q.filament_id = f.id
      WHERE q.status IN ('approved', 'in_production', 'delivered')
      GROUP BY f.id
      ORDER BY total_grams DESC
      LIMIT 10
    `);

    // 3. Printer Performance with Maintenance and ROI
    const [printerRows] = await pool.query(`
      SELECT
        p.name as printer_name,
        p.purchase_price,
        SUM(q.print_time_hours) as total_hours,
        SUM(q.final_price) as total_revenue,
        (
          SELECT COALESCE(SUM(cost), 0)
          FROM printer_maintenance_logs
          WHERE printer_id = p.id
        ) + (
          SELECT COALESCE(SUM(mc.quantity * mc.unit_cost), 0)
          FROM maintenance_consumables mc
          JOIN printer_maintenance_logs ml ON mc.maintenance_log_id = ml.id
          WHERE ml.printer_id = p.id
        ) as total_maint_cost
      FROM quotes q
      JOIN printers p ON q.printer_id = p.id
      WHERE q.status IN ('approved', 'in_production', 'delivered')
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `);

    // 4. Detailed Stats for KPIs
    const [statRows] = await pool.query(`
      SELECT
        SUM(final_price) as total_revenue,
        SUM(cost_total_production) as total_costs,
        SUM(tax_amount) as total_taxes,
        SUM(print_time_hours * quantity) as total_hours,
        SUM(filament_used_g * quantity) as total_filament_g,
        COUNT(*) as total_quotes,
        SUM(CASE WHEN status IN ('approved', 'in_production', 'delivered') THEN 1 ELSE 0 END) as approved_quotes,
        AVG(CASE WHEN status IN ('approved', 'in_production', 'delivered') AND responded_at IS NOT NULL
            THEN TIMESTAMPDIFF(SECOND, created_at, responded_at) ELSE NULL END) as avg_response_time_seconds
      FROM quotes
    `);
    const stats = (statRows as any[])[0];

    // 5. Total Maintenance Costs (Global)
    const [maintTotalRows] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(cost), 0) FROM printer_maintenance_logs) +
        (SELECT COALESCE(SUM(mc.quantity * mc.unit_cost), 0) FROM maintenance_consumables mc) as total_maint
    `) as any[];
    const globalMaintCost = Number(maintTotalRows[0].total_maint || 0);

    // 6. Conversion Stats by Status
    const [conversionRows] = await pool.query(`
      SELECT status, COUNT(*) as count FROM quotes GROUP BY status
    `);

    return NextResponse.json({
      revenueByMonth: revenueRows,
      materialUsage: materialRows,
      printerPerformance: printerRows,
      conversionStats: conversionRows,
      summary: {
        revenue: Number(stats.total_revenue || 0),
        costs: Number(stats.total_costs || 0) + globalMaintCost,
        taxes: Number(stats.total_taxes || 0),
        profit: Number(stats.total_revenue || 0) - Number(stats.total_costs || 0) - globalMaintCost,
        total_hours: Number(stats.total_hours || 0),
        total_filament_g: Number(stats.total_filament_g || 0),
        total_quotes: Number(stats.total_quotes || 0),
        approved_quotes: Number(stats.approved_quotes || 0),
        approval_rate: stats.total_quotes > 0 ? (stats.approved_quotes / stats.total_quotes) * 100 : 0,
        avg_response_time: Number(stats.avg_response_time_seconds || 0)
      }
    });
  } catch (error: any) {
    console.error("Metrics API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
