import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkSellerOrAdmin, forbiddenResponse } from "@/lib/adminCheck";
import { uploadFile } from "@/lib/upload";

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const auctions = await query(
      `SELECT a.*, c.name as winner_name
       FROM auction_items a
       LEFT JOIN clients c ON a.winner_id = c.id
       ORDER BY a.created_at DESC`
    );
    return NextResponse.json(auctions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkSellerOrAdmin()) return forbiddenResponse();
  try {
    const data = await req.formData();

    const title = data.get("title") as string;
    const description = data.get("description") as string;
    const retailValue = parseFloat(data.get("retail_value") as string) || 0;
    const timeIncrement = parseInt(data.get("time_increment") as string) || 15;
    const endTime = data.get("end_time") as string; // Expects valid datetime string like 'YYYY-MM-DD HH:mm:ss'
    const status = data.get("status") as string || 'pending';
    const minSalePrice = parseFloat(data.get("min_sale_price") as string) || 0;
    const botEnabled = data.get("bot_enabled") === "1" ? true : false;
    const botMaxPrice = parseFloat(data.get("bot_max_price") as string) || 0;

    // Novos campos
    const videoUrl = data.get("video_url") as string || null;
    const weight = data.get("weight") as string || null;
    const dimensions = data.get("dimensions") as string || null;

    const imageFile = data.get("image") as File;
    let imageUrl = "";

    const additionalImageFiles = data.getAll("additional_images") as File[];
    const additionalImageUrls: string[] = [];

    if (!title || !endTime) {
      return NextResponse.json({ error: "Título e Data/Hora de encerramento são obrigatórios." }, { status: 400 });
    }

    if (imageFile) {
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

    const result: any = await query(
      `INSERT INTO auction_items (title, description, image_url, retail_value, end_time, status, time_increment, min_sale_price, bot_enabled, bot_max_price, additional_images, video_url, weight, dimensions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, imageUrl, retailValue, endTime, status, timeIncrement, minSalePrice, botEnabled, botMaxPrice, additionalImagesJson, videoUrl, weight, dimensions]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
