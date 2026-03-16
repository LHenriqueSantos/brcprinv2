import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
});

export async function POST(req: Request) {
  try {
    // Focus NFe sends JSON body to webhook URL
    const body = await req.json();

    const { ref, status, caminho_xml_nota_fiscal, caminho_danfe } = body;

    // Webhook validation
    if (!ref) {
      return NextResponse.json({ error: "Missing ref" }, { status: 400 });
    }

    // Ref in our system is the Quote ID because we called the API with ?ref=QUOTEID
    const quoteId = parseInt(ref);

    let nfeUrl = caminho_danfe || caminho_xml_nota_fiscal || null;

    // Se o webhook envia "autorizado" ou "erro", nós gravamos no banco.
    await pool.query(
      "UPDATE quotes SET nfe_status = ?, nfe_url = ? WHERE id = ?",
      [status, nfeUrl, quoteId]
    );

    return NextResponse.json({ success: true, ref: quoteId, status: status });

  } catch (error: any) {
    console.error("Focus NFe Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
