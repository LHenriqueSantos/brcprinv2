import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import fs from "fs";

/**
 * Uploads a file to the public/uploads directory.
 * @param file The File object from the request
 * @param subDir Optional subdirectory inside public/uploads
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, subDir: string = ""): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const baseUploadDir = join(process.cwd(), "public", "uploads");
  const targetDir = subDir ? join(baseUploadDir, subDir) : baseUploadDir;

  if (!fs.existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  // Sanitize file name
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uniqueName = `${Date.now()}-${safeName}`;
  const filePath = join(targetDir, uniqueName);

  await writeFile(filePath, buffer);

  const relativeUrl = subDir
    ? `/uploads/${subDir}/${uniqueName}`
    : `/uploads/${uniqueName}`;

  return relativeUrl;
}
