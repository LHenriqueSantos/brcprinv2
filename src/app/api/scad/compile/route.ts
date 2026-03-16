import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import fs from "fs";
import path from "path";
import { uploadFile } from "@/lib/upload";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { model_id, parameters } = body;

    if (!model_id || !parameters) {
      return NextResponse.json({ error: "model_id e parameters são obrigatórios" }, { status: 400 });
    }

    // Buscar a url do OpenSCAD físico e titulo no DB
    const results: any[] = await query(`SELECT scad_file_url, title FROM parametric_models WHERE id = ?`, [model_id]);
    if (results.length === 0) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
    }

    const scadUrl = results[0].scad_file_url;

    // Baixar o scad do storage/bucket local para montar o Request Físico form-data
    let scadBuffer: Buffer;
    if (scadUrl.startsWith("http")) {
      const scadRes = await fetch(scadUrl);
      scadBuffer = Buffer.from(await scadRes.arrayBuffer());
    } else {
      const localPath = path.join(process.cwd(), "public", scadUrl);
      scadBuffer = fs.readFileSync(localPath);
    }

    // Montando a Request em memoria pra o Slicer-API via Next.js Proxy
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(scadBuffer)]);
    // The underlying fetch needs actual File-like objects
    formData.append("scad_file", blob, "model.scad");
    formData.append("parameters", JSON.stringify(parameters));

    // Despacha pro NOVO Microserviço SCAD dedicado (Porta 3006)
    const scadApiUrl = process.env.SCAD_API_URL || "http://127.0.0.1:3006";
    console.log(`[SCAD] Tentando conectar na SCAD API Dedicada: ${scadApiUrl}/render-scad`);

    const renderReq = await fetch(`${scadApiUrl}/render-scad`, {
      method: "POST",
      body: formData
    });

    if (!renderReq.ok) {
      const errTxt = await renderReq.text();
      console.error(`[SCAD] Erro no Container: ${errTxt}`);
      throw new Error(`OpenSCAD Container Error: ${errTxt}`);
    }

    // Recebendo o STL puro de volta
    const stlArrayBuffer = await renderReq.arrayBuffer();
    console.log(`[SCAD] STL recebido com sucesso (${stlArrayBuffer.byteLength} bytes)`);

    // Salvamento seguro e oficial no Storage do App BRCPrint
    const fileName = `custom_scad_${Date.now()}.stl`;
    const finalDir = path.join(process.cwd(), "public", "uploads", "custom_scads");

    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    const finalPath = path.join(finalDir, fileName);
    fs.writeFileSync(finalPath, Buffer.from(stlArrayBuffer));

    return NextResponse.json({ success: true, stl_url: `/uploads/custom_scads/${fileName}` });

  } catch (error: any) {
    console.error("SCAD Compile Route Error DETAILED:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
