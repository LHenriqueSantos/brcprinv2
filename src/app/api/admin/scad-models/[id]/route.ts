import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { uploadFile } from "@/lib/upload";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.formData();

    const title = data.get("title") as string;
    const description = data.get("description") as string;
    const category = data.get("category") as string;
    const basePrice = parseFloat(data.get("base_price") as string) || 0;
    const active = data.get("active") === "true" ? 1 : 0;

    // Check if new files were uploaded
    const imageFile = data.get("image") as File | null;
    const scadFile = data.get("scad_file") as File | null;
    const parametersSchema = data.get("parameters_schema") as string | null;

    let updateFields = "title = ?, description = ?, category = ?, base_price = ?, active = ?";
    let updateValues: any[] = [title, description, category, basePrice, active];

    if (imageFile) {
      const imageUrl = await uploadFile(imageFile, "parametric_images");
      updateFields += ", image_url = ?";
      updateValues.push(imageUrl);
    }

    if (scadFile && parametersSchema) {
      const scadFileUrl = await uploadFile(scadFile, "scad_models");
      updateFields += ", scad_file_url = ?, parameters_schema = ?";
      updateValues.push(scadFileUrl, parametersSchema);
    }

    updateValues.push(id);

    await query(
      `UPDATE parametric_models SET ${updateFields} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao atualizar modelo paramétrico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await query("DELETE FROM parametric_models WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao deletar modelo paramétrico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
