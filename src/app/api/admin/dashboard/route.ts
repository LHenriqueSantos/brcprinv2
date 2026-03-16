import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();

  try {
    // 1. Total Revenue (Quotes) - Paid or delivered quotes
    const [quotesRevenueRows]: any = await pool.query(`
      SELECT SUM(final_price) as total
      FROM quotes
      WHERE status IN ('approved', 'in_production', 'delivered')
    `);
    const quotesRevenue = Number(quotesRevenueRows[0]?.total || 0);

    // 2. Total Revenue (Cart Orders) - Paid, processing, or shipped
    const [ordersRevenueRows]: any = await pool.query(`
      SELECT SUM(total) as total
      FROM cart_orders
      WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
    `);
    const ordersRevenue = Number(ordersRevenueRows[0]?.total || 0);

    const total_revenue = quotesRevenue + ordersRevenue;

    // 3. Status Counts (Combined)
    const [quotesStatusRows]: any = await pool.query(`
      SELECT status, COUNT(*) as count FROM quotes GROUP BY status
    `);
    const [ordersStatusRows]: any = await pool.query(`
      SELECT status, COUNT(*) as count FROM cart_orders GROUP BY status
    `);

    // Normalize status into unified categories for the frontend pie chart
    const unifiedStatus: Record<string, number> = {
      pending: 0,
      approved: 0,
      production: 0,
      delivered: 0,
      cancelled: 0
    };

    quotesStatusRows.forEach((row: any) => {
      if (row.status === 'pending') unifiedStatus.pending += row.count;
      if (row.status === 'approved') unifiedStatus.approved += row.count;
      if (row.status === 'in_production') unifiedStatus.production += row.count;
      if (row.status === 'delivered') unifiedStatus.delivered += row.count;
      if (row.status === 'cancelled' || row.status === 'rejected') unifiedStatus.cancelled += row.count;
    });

    ordersStatusRows.forEach((row: any) => {
      if (row.status === 'pending_payment') unifiedStatus.pending += row.count;
      if (row.status === 'paid') unifiedStatus.approved += row.count;
      if (row.status === 'processing') unifiedStatus.production += row.count;
      if (row.status === 'shipped' || row.status === 'delivered') unifiedStatus.delivered += row.count;
      if (row.status === 'cancelled') unifiedStatus.cancelled += row.count;
    });

    // 4. Revenue by Day (Last 14 days) - Combined
    // To do this reliably in SQL, we group by DATE(created_at).
    const [quotesDailyRows]: any = await pool.query(`
      SELECT DATE(created_at) as date, SUM(final_price) as revenue
      FROM quotes
      WHERE status IN ('approved', 'in_production', 'delivered')
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY DATE(created_at)
    `);

    const [ordersDailyRows]: any = await pool.query(`
      SELECT DATE(created_at) as date, SUM(total) as revenue
      FROM cart_orders
      WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY DATE(created_at)
    `);

    const dailyRevenueMap: Record<string, number> = {};
    const processDaily = (rows: any[]) => {
      rows.forEach(row => {
        // Handle timezone issues by treating the date string explicitly
        const dateStr = new Date(row.date).toISOString().split('T')[0];
        dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + Number(row.revenue);
      });
    };
    processDaily(quotesDailyRows);
    processDaily(ordersDailyRows);

    const revenue_by_day = Object.entries(dailyRevenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 5. Top Selling Products (From Cart Orders)
    const [topSellingRows]: any = await pool.query(`
      SELECT title, SUM(quantity) as total_sold, SUM(price * quantity) as revenue
      FROM cart_order_items
      GROUP BY catalog_item_id, title
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // 6. Latest Combined Orders (For the Table)
    const [latestQuotes]: any = await pool.query(`
      SELECT id, title, status, final_price_per_unit as total, created_at, 'quote' as source
      FROM quotes
      ORDER BY created_at DESC LIMIT 10
    `);

    const [latestOrders]: any = await pool.query(`
      SELECT id, CONCAT('Pedido #', id) as title, status, total, created_at, 'cart' as source
      FROM cart_orders
      ORDER BY created_at DESC LIMIT 10
    `);

    // Merge and sort in JS to get the absolute top 10 recent
    const combinedLatest = [...latestQuotes, ...latestOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      total_revenue,
      sales_by_status: Object.entries(unifiedStatus).map(([status, count]) => ({ status, count })),
      revenue_by_day,
      top_selling_items: topSellingRows,
      latest_combined_orders: combinedLatest
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
