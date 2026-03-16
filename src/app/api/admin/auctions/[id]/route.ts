import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const { id } = await params;

    await query("DELETE FROM auction_items WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { uploadFile } from "@/lib/upload";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const { id } = await params;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.status === 'active') {
        const resetQuery = `UPDATE auction_items SET status = ?, end_time = DATE_ADD(NOW(), INTERVAL time_increment SECOND) WHERE id = ?`;
        await query(resetQuery, [body.status, id]);
      } else if (body.status) {
        await query("UPDATE auction_items SET status = ? WHERE id = ?", [body.status, id]);
      }
      return NextResponse.json({ success: true });
    }

    // Edição completa via FormData
    const data = await req.formData();
    const title = data.get("title") as string;
    const description = data.get("description") as string;
    const retailValue = parseFloat(data.get("retail_value") as string) || 0;
    const timeIncrement = parseInt(data.get("time_increment") as string) || 15;
    const endTime = data.get("end_time") as string;
    const minSalePrice = parseFloat(data.get("min_sale_price") as string) || 0;
    const botEnabled = data.get("bot_enabled") === "1" ? true : false;
    const botMaxPrice = parseFloat(data.get("bot_max_price") as string) || 0;

    // Novos campos
    const videoUrl = data.get("video_url") as string || null;
    const weight = data.get("weight") as string || null;
    const dimensions = data.get("dimensions") as string || null;

    const imageFile = data.get("image") as File;
    const additionalImageFiles = data.getAll("additional_images") as File[];
    const additionalImageUrls: string[] = [];

    if (!title || !endTime) {
      return NextResponse.json({ error: "Título e Data/Hora são obrigatórios." }, { status: 400 });
    }

    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadFile(imageFile, "auction_images");
    }

    if (additionalImageFiles && additionalImageFiles.length > 0) {
      for (const file of additionalImageFiles) {
        if (file.size > 0) {
          const uploadedUrl = await uploadFile(file, "auction_images");
          additionalImageUrls.push(uploadedUrl);
        }
      }
    }
    const additionalImagesJson = additionalImageUrls.length > 0 ? JSON.stringify(additionalImageUrls) : null;

    let updateQuery = `UPDATE auction_items SET title=?, description=?, retail_value=?, time_increment=?, end_time=?, min_sale_price=?, bot_enabled=?, bot_max_price=?, video_url=?, weight=?, dimensions=?`;
    const updateValues: any[] = [title, description, retailValue, timeIncrement, endTime, minSalePrice, botEnabled, botMaxPrice, videoUrl, weight, dimensions];

    if (imageUrl) {
      updateQuery += `, image_url=?`;
      updateValues.push(imageUrl);
    }
    if (additionalImagesJson) {
      updateQuery += `, additional_images=?`;
      updateValues.push(additionalImagesJson);
    }

    updateQuery += ` WHERE id=?`;
    updateValues.push(id);

    await query(updateQuery, updateValues);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT Auction Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
