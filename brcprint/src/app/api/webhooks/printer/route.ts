import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { transitionQuoteStatus } from "@/lib/quoteStatusEngine";

// General webhook receiver for Moonraker/OctoPrint
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Identify where this came from (by IP or by API Key matching if we passed one, or just trust the payload if it includes printer identifier)
    // Unfortunately, OctoPrint webhooks don't tell us their own IP by default unless configured.
    // However, they DO tell us the topic/event e.g. "PrintDone".
    // A simpler approach for this PoC:
    // We expect the user to configure the webhook with a query parameter ?printer_id=X

    const { searchParams } = new URL(req.url);
    const printerIdStr = searchParams.get("printer_id");

    if (!printerIdStr) {
      console.warn("[Printer Webhook] Received webhook but no ?printer_id= parameter was provided in the URL.");
      return NextResponse.json({ success: true, ignored: "Missing printer_id query param." });
    }

    const printerId = Number(printerIdStr);

    let isPrintDoneEvent = false;

    // Detect OctoPrint event payload
    if (body.topic && body.topic === 'PrintDone') {
      isPrintDoneEvent = true;
    }
    // Detect Moonraker/Klipper payload (varies by how webhook is configured, often custom formatted)
    // E.g. Moonraker Webhook plugin might send {"action": "print_done"} or similar.
    else if (body.action === 'print_done' || body.event === 'PrintDone' || body.state === 'complete') {
      isPrintDoneEvent = true;
    }

    if (!isPrintDoneEvent) {
      // Ignora outros eventos tipo PrintFailed, PrintStarted, bed/extruder temps, etc.
      return NextResponse.json({ success: true, ignored: "Not a PrintDone event." });
    }

    // 2. Locate the active quote currently printing on this printer
    // Status 'in_production' and printer_id = X
    const [quotes]: any = await pool.query(
      "SELECT id FROM quotes WHERE status = 'in_production' AND printer_id = ? ORDER BY updated_at DESC LIMIT 1",
      [printerId]
    );

    if (quotes.length === 0) {
      console.warn(`[Printer Webhook] Received PrintDone for printer ${printerId}, but no active quote found in production.`);
      return NextResponse.json({ success: true, ignored: "No quote in production for this printer." });
    }

    const quoteId = quotes[0].id;
    const result = await transitionQuoteStatus(quoteId, 'delivered', 'printer_webhook');

    // Optional: Update printer's current hours printed based on the quote's estimate.
    await pool.query(
      "UPDATE printers p JOIN quotes q ON q.printer_id = p.id SET p.current_hours_printed = p.current_hours_printed + COALESCE(q.print_time_hours, 0) WHERE q.id = ?",
      [quoteId]
    );
    return NextResponse.json({ success: true, message: `Quote #${quoteId} auto-completed via IoT webhook.` });

  } catch (error: any) {
    console.error("[Printer Webhook Error]", error);
    return NextResponse.json({ error: "Erro interno no processamento do Webhook." }, { status: 500 });
  }
}
