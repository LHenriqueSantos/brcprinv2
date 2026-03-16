import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { uploadFile } from "@/lib/upload";

export async function GET() {
  try {
    const models = await query(
      "SELECT id, title, description, category, image_url, scad_file_url, parameters_schema, base_price, filament_id, active, created_at FROM parametric_models ORDER BY created_at DESC"
    );
    return NextResponse.json(models);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.formData();

    const title = data.get("title") as string;
    const description = data.get("description") as string;
    const category = data.get("category") as string;
    const basePrice = parseFloat(data.get("base_price") as string) || 0;
    const filamentId = data.get("filament_id") ? parseInt(data.get("filament_id") as string) : null;
    const active = data.get("active") === "true" ? 1 : 0;
    const parametersSchema = data.get("parameters_schema") as string; // Will come from /api/scad/extract

    const imageFile = data.get("image") as File;
    const scadFile = data.get("scad_file") as File;

    if (!title || !scadFile || !parametersSchema) {
      return NextResponse.json({ error: "Título, Arquivo SCAD e Schema são obrigatórios." }, { status: 400 });
    }

    // Upload Files
    let imageUrl = "";
    if (imageFile) {
      imageUrl = await uploadFile(imageFile, "parametric_images");
    }

    const scadFileUrl = await uploadFile(scadFile, "scad_models");

    const result = await query(
      `INSERT INTO parametric_models
      (title, description, category, image_url, scad_file_url, parameters_schema, base_price, filament_id, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category, imageUrl, scadFileUrl, parametersSchema, basePrice, filamentId, active]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error: any) {
    console.error("Erro ao salvar modelo paramétrico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
