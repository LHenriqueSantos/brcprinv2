import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { transitionQuoteStatus } from "@/lib/quoteStatusEngine";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, filamentLotId, resultPhotoUrl, showInShowroom } = body;

    if (!status) {
      return NextResponse.json({ error: "Faltam dados" }, { status: 400 });
    }

    // Call shared engine instead of manually calculating everything inline
    await transitionQuoteStatus(id, status, 'admin_panel', filamentLotId, resultPhotoUrl, showInShowroom);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro API status:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
