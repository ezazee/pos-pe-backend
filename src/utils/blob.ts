import { put } from "@vercel/blob";
import type { PutBlobResult } from "@vercel/blob";

export async function uploadToVercelBlob(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const result: PutBlobResult = await put(`products/${filename}`, buffer, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  });
  return result.url;
}
