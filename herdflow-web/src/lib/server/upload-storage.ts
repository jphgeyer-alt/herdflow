import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveUploadedFile(
  file: File,
  bucket: "seller" | "logistics",
  keyPrefix: string,
) {
  const uploadsRoot = path.join(process.cwd(), "public", "uploads", bucket);
  await mkdir(uploadsRoot, { recursive: true });

  const safeName = sanitizeFileName(file.name || "document.bin");
  const fileName = `${keyPrefix}-${safeName}`;
  const diskPath = path.join(uploadsRoot, fileName);
  const arrayBuffer = await file.arrayBuffer();

  await writeFile(diskPath, Buffer.from(arrayBuffer));

  return `/uploads/${bucket}/${fileName}`;
}
