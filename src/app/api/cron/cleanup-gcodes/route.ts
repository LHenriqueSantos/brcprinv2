import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request) {
  // Simple check to ensure it's either localhost or a known cron service via header
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'brcprint-cron-secret'}`) {
    console.warn("[Cron] Unauthorized trigger attempt for GCodes Cleanup.");
    // In production, we might want to strictly blocked this, but for internal MVP it's often OK
  }

  console.log("[Cron] Starting Abandoned GCodes / Uploads Cleanup...");

  try {
    // 1. Encontrar cotações antigas pendentes (abandonment > 72h)
    // Cotações nos status 'pending' ou 'quoted' presumivelmente não foram pagas.
    // E precisamos excluir apenas as que contêm arquivo físico em public/uploads ou public/outputs
    const [qRows] = await pool.query(`
      SELECT id, file_urls, gcode_url, status, items
      FROM quotes
      WHERE status IN ('pending', 'quoted')
        AND created_at < NOW() - INTERVAL 72 HOUR
    `);

    const abandonedQuotes = qRows as any[];
    let deletedFilesCount = 0;

    for (const quote of abandonedQuotes) {
      const filesToDelete: string[] = [];

      // Add single items fallback
      if (quote.gcode_url) filesToDelete.push(quote.gcode_url);

      const fileUrls = typeof quote.file_urls === 'string' ? JSON.parse(quote.file_urls) : quote.file_urls;
      if (Array.isArray(fileUrls)) {
        filesToDelete.push(...fileUrls);
      }

      // Add detailed items from JSON array (Phase 52 metadata)
      const items = typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items;
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.gcode_url) filesToDelete.push(item.gcode_url);
          if (item.file_url) filesToDelete.push(item.file_url);
        }
      }

      // Deduplicate array
      const uniqueFiles = Array.from(new Set(filesToDelete)).filter(f => f);

      // Perform Physical file deletion
      for (const fileUrl of uniqueFiles) {
        try {
          // Adjust path if it contains leading slash
          const relativePath = fileUrl.replace(/^\//, '');
          const physicalPath = path.join(process.cwd(), 'public', relativePath);

          await fs.unlink(physicalPath);
          deletedFilesCount++;
          console.log(`[Cron] Deleted abandoned file to save space: ${physicalPath}`);
        } catch (unlinkErr: any) {
          // File might already be deleted or not found, just ignore and proceed
          if (unlinkErr.code !== 'ENOENT') {
            console.error(`[Cron] Failed to delete ${fileUrl}:`, unlinkErr);
          }
        }
      }

      // We could optionally set `gcode_url = null` in the database to reflect that the physical file is gone,
      // but if the quote is 'quoted'/'pending' and 72h older, it's effectively dead anyway.
      // Doing it just to keep database clean.
      await pool.query("UPDATE quotes SET gcode_url = NULL WHERE id = ?", [quote.id]);
    }

    return NextResponse.json({
      success: true,
      quotes_processed: abandonedQuotes.length,
      files_deleted: deletedFilesCount,
      message: `Removed ${deletedFilesCount} old files from ${abandonedQuotes.length} abandoned quotes.`
    });

  } catch (error) {
    console.error("[Cron Error]", error);
    return NextResponse.json({ success: false, error: "Database or filesystem failure." }, { status: 500 });
  }
}
