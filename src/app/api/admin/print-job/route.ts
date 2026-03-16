import { NextResponse } from "next/server";
import pool from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const quoteIdStr = formData.get("quote_id") as string;
    const printerIdStr = formData.get("printer_id") as string;
    const gcodeFile = formData.get("gcode") as File | null;

    if (!quoteIdStr || !printerIdStr || !gcodeFile) {
      return NextResponse.json({ error: "Faltam parâmetros." }, { status: 400 });
    }

    const quoteId = Number(quoteIdStr);
    const printerId = Number(printerIdStr);

    // 1. Get printer info
    const [printerRows]: any = await pool.query("SELECT * FROM printers WHERE id = ?", [printerId]);
    if (printerRows.length === 0) {
      return NextResponse.json({ error: "Impressora não encontrada." }, { status: 404 });
    }
    const printer = printerRows[0];

    // 2. Save file locally
    const uploadDir = path.join(process.cwd(), "public/uploads/gcodes");
    await fs.mkdir(uploadDir, { recursive: true });

    const safeName = gcodeFile.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await gcodeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filepath, buffer);

    const gcodeUrl = `/uploads/gcodes/${filename}`;

    // Update DB
    await pool.query("UPDATE quotes SET printer_id = ?, gcode_url = ? WHERE id = ?", [printerId, gcodeUrl, quoteId]);

    // 3. Dispatch to specific API if configured
    if (printer.api_type && printer.api_type !== 'none' && printer.ip_address) {
      let printSuccess = false;
      let apiResponse = "";

      const baseUrl = printer.ip_address.startsWith('http') ? printer.ip_address : `http://${printer.ip_address}`;

      try {
        if (printer.api_type === 'octoprint') {
          // OctoPrint Upload & Print API
          // POST /api/files/local
          const octoFormData = new FormData();
          const localBlob = new Blob([buffer], { type: 'application/octet-stream' });
          octoFormData.append("file", localBlob, filename);
          octoFormData.append("select", "true");
          octoFormData.append("print", "true");

          const res = await fetch(`${baseUrl}/api/files/local`, {
            method: 'POST',
            headers: {
              'X-Api-Key': printer.api_key || '',
            },
            body: octoFormData,
          });

          apiResponse = await res.text();
          if (res.ok) printSuccess = true;

        } else if (printer.api_type === 'moonraker') {
          // Moonraker / Klipper API
          // POST /server/files/upload
          const moonFormData = new FormData();
          const localBlob = new Blob([buffer], { type: 'application/octet-stream' });
          moonFormData.append("file", localBlob, filename);
          // Moonraker requires you to also send print action? Wait, Moonraker upload is /server/files/upload
          // then you can issue a print command.

          const uploadRes = await fetch(`${baseUrl}/server/files/upload`, {
            method: 'POST',
            body: moonFormData, // Key not strictly used in headers usually, but depends on config
          });

          apiResponse = await uploadRes.text();

          if (uploadRes.ok) {
            // Now start the print via RPC
            const printRes = await fetch(`${baseUrl}/printer/print/start?filename=${filename}`, {
              method: 'POST'
            });
            if (printRes.ok) printSuccess = true;
          }
        }

        if (!printSuccess) {
          console.error(`[IoT] Falha ao enviar para ${printer.name}:`, apiResponse);
          // We don't throw, we just log and proceed. The card will still move.
          return NextResponse.json({ success: true, warning: `Arquivo salvo, mas a impressora rejeitou o comando: ${apiResponse.substring(0, 50)}` });
        }

        return NextResponse.json({ success: true, message: "Enviado com sucesso via rede local!" });

      } catch (e: any) {
        console.error("[IoT Network Error]", e);
        return NextResponse.json({ success: true, warning: "Arquivo salvo, mas falhou ao tentar conexão de rede com a impressora." });
      }
    }

    return NextResponse.json({ success: true, message: "Arquivo G-Code salvo localmente com sucesso." });

  } catch (error: any) {
    console.error("[Print-Job Proxy]", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
