import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await checkSellerOrAdmin())) return forbiddenResponse();

  const conn = await (pool as any).getConnection();
  try {
    await conn.beginTransaction();

    // Disable FK checks so we can delete in any order
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // --- Transactional / test data to wipe ---

    // Bids & Auctions
    await conn.query("DELETE FROM bid_history");
    await conn.query("DELETE FROM auction_bids");
    await conn.query("DELETE FROM auctions");
    await conn.query("DELETE FROM auction_items");
    await conn.query("DELETE FROM client_bids_balance");
    await conn.query("DELETE FROM bids");

    // Affiliates (commissions only, keep affiliate profiles)
    await conn.query("DELETE FROM affiliate_commissions");

    // B2B subscriptions / hours
    await conn.query("DELETE FROM hour_transactions");

    // Quote children first, then quotes
    await conn.query("DELETE FROM quote_messages");
    await conn.query("DELETE FROM quote_bom");
    await conn.query("DELETE FROM quote_consumables");
    await conn.query("DELETE FROM reviews");
    await conn.query("DELETE FROM platters");
    await conn.query("DELETE FROM platters_items");
    await conn.query("DELETE FROM quotes");

    // Quote requests
    await conn.query("DELETE FROM quote_request_items");
    await conn.query("DELETE FROM quote_requests");

    // Cart / digital orders
    await conn.query("DELETE FROM cart_order_items");
    await conn.query("DELETE FROM cart_orders");
    await conn.query("DELETE FROM digital_orders");

    // Projects & assemblies
    await conn.query("DELETE FROM project_parts");
    await conn.query("DELETE FROM projects");

    // Maintenance logs
    await conn.query("DELETE FROM maintenance_consumables");
    await conn.query("DELETE FROM printer_maintenance_logs");

    // Filament lots (traceability)
    await conn.query("DELETE FROM filament_lots");

    // Expenses
    await conn.query("DELETE FROM expenses");

    // Coupons (discount codes created for testing)
    await conn.query("DELETE FROM coupons");

    // Password reset tokens
    await conn.query("DELETE FROM password_resets");

    // Clients (bots + real test clients)
    await conn.query("DELETE FROM affiliates");
    await conn.query("DELETE FROM clients");

    // Re-enable FK checks
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    await conn.commit();

    return NextResponse.json({ success: true, message: "Banco resetado com sucesso." });
  } catch (error: any) {
    await conn.rollback();
    await conn.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => { });
    console.error("reset-db error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    conn.release();
  }
}
