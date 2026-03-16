import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // --- SECURITY VALIDATIONS ---
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. O limite máximo é 50MB." }, { status: 413 });
    }

    const allowedExtensions = ['.stl', '.obj', '.step', '.3mf', '.zip', '.gcode', '.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const fileNameLower = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValidExtension) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido. Apenas arquivos 3D ou imagens são aceitos." }, { status: 415 });
    }
    // ----------------------------

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e: any) {
      // Ignora se a pasta já existe
    }

    // Limpa o nome do arquivo de caracteres perigosos/espaços
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;
    const path = join(uploadDir, uniqueName);

    await writeFile(path, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${uniqueName}`,
      fileName: file.name
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
