import { NextResponse } from "next/server";
import pool from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;

    const [quoteRows]: any = await pool.query(
      "SELECT id, client_id, status FROM quotes WHERE public_token = ?",
      [token]
    );

    if (quoteRows.length === 0) {
      return NextResponse.json({ success: false, error: "Cotação não encontrada" }, { status: 404 });
    }

    const quote = quoteRows[0];

    // Optional constraint: only allow reviews for delivered quotes, but maybe be lenient in dev
    // if (quote.status !== 'delivered') {
    //   return NextResponse.json({ success: false, error: "Apenas pedidos entregues podem ser avaliados." }, { status: 400 });
    // }

    const formData = await req.formData();
    const ratingStr = formData.get("rating") as string;
    const comment = formData.get("comment") as string || "";
    const photo = formData.get("photo") as File | null;

    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Nota inválida" }, { status: 400 });
    }

    let photoUrl = null;

    // Handle File Upload
    if (photo) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public/uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const safeName = photo.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
      const filename = `${Date.now()}-${safeName}`;
      const filepath = path.join(uploadDir, filename);

      await fs.writeFile(filepath, buffer);
      photoUrl = `/uploads/${filename}`;
    }

    // Upsert logic: a client can update their review if they submit again
    const [existing]: any = await pool.query("SELECT id FROM reviews WHERE quote_id = ?", [quote.id]);

    if (existing.length > 0) {
      await pool.query(
        "UPDATE reviews SET rating = ?, comment = ?, photo_url = COALESCE(?, photo_url), status = 'pending', updated_at = NOW() WHERE id = ?",
        [rating, comment, photoUrl, existing[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO reviews (quote_id, client_id, rating, comment, photo_url, status) VALUES (?, ?, ?, ?, ?, 'pending')",
        [quote.id, quote.client_id, rating, comment, photoUrl]
      );
    }

    return NextResponse.json({ success: true, message: "Avaliação registrada com sucesso." });
  } catch (error: any) {
    console.error("[Review API]", error);
    return NextResponse.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
