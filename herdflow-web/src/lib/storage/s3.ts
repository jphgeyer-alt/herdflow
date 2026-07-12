// Thin wrapper around an S3-compatible object store for digital product
// files. Deliberately generic (no AWS-only features) so it works against
// real AWS S3, Cloudflare R2, MinIO, or any other S3-compatible provider —
// set S3_ENDPOINT for anything that isn't real AWS.
//
// Files here are NEVER served via a public/pre-signed URL — the download
// route (src/app/api/downloads/[token]/route.ts) reads the object
// server-side and streams it through, after validating the purchase token,
// expiry, and download-count limit. The bucket itself should be private.
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import { env } from "@/lib/env";

function getClient(): S3Client {
  return new S3Client({
    region: env.S3_REGION || "auto",
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(env.S3_ENDPOINT), // required for R2/MinIO-style endpoints
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}

export function isStorageConfigured(): boolean {
  return Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  if (!isStorageConfigured()) {
    throw new Error(
      "Object storage is not configured — set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.",
    );
  }
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getObjectStream(
  key: string,
): Promise<{ stream: Readable; contentType?: string; contentLength?: number }> {
  if (!isStorageConfigured()) {
    throw new Error("Object storage is not configured.");
  }
  const client = getClient();
  const result = await client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return {
    stream: result.Body as Readable,
    contentType: result.ContentType,
    contentLength: result.ContentLength,
  };
}
