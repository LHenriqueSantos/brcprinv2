import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { transitionQuoteStatus } from "@/lib/quoteStatusEngine";

// PUT /api/admin/platters/[id]/status
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, printer_id, resultPhotoUrl, showInShowroom } = body;

    if (!['pending', 'in_production', 'delivered'].includes(status)) {
      return NextResponse.json({ error: "Status inválido para o Lote" }, { status: 400 });
    }

    // Update the platter itself
    const updatePlatterParams: any[] = [status];
    let updateQuery = "UPDATE platters SET status = ?";

    if (printer_id !== undefined) {
      updateQuery += ", printer_id = ?";
      updatePlatterParams.push(printer_id);
    }

    // Set start/end timestamps based on the status mapping
    if (status === 'in_production') {
      updateQuery += ", start_time = NOW()";
    } else if (status === 'delivered') {
      updateQuery += ", end_time = NOW()";
    }

    updateQuery += " WHERE id = ?";
    updatePlatterParams.push(id);

    await pool.query(updateQuery, updatePlatterParams);

    // Now find all quotes inside this platter and update them individually via the robust engine
    const [quotesObj] = await pool.query(
      `SELECT id FROM quotes WHERE platter_id = ?`,
      [id]
    );
    const quotes = quotesObj as { id: number }[];

    if (quotes.length > 0) {
      // Run the robust status engine for each quote in the batch
      // This will deduct inventory, send correct whatsapp messages to multiple clients, etc
      for (const qt of quotes) {
        let payloadStr = undefined;
        // Note: In platter move, we don't pass individual lotId for now.
        // transitionQuoteStatus handles printer assignment if passed via origin/parameters.
        // But transitionQuoteStatus doesn't take printer_id directly as an argument,
        // it expects it to be either already in the quote or assigned via logic.

        // We await inside loop to avoid DB locks / overload from too many concurrent actions
        await transitionQuoteStatus(qt.id, status, 'admin_panel', null, resultPhotoUrl || null, showInShowroom || null);
      }
    }

    return NextResponse.json({ success: true, count: quotes.length });
  } catch (error: any) {
    console.error("PUT Platter Status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
