import { put } from "@vercel/blob";
import type { PutBlobResult } from "@vercel/blob";

/**
 * Upload file buffer ke Vercel Blob
 * @param buffer File buffer dari multer
 * @param filename Nama file (misal "prod_123.jpg")
 * @returns URL publik gambar yang diupload
 */
export async function uploadToVercelBlob(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    const blob: PutBlobResult = await put(`products/${filename}`, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
    return blob.url;
  } catch (error) {
    console.error("❌ Gagal upload ke Vercel Blob:", error);
    throw new Error("Upload gagal");
  }
}
