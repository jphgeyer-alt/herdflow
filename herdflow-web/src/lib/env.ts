export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  PAYFAST_MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID || "",
  PAYFAST_MERCHANT_KEY: process.env.PAYFAST_MERCHANT_KEY || "",
  PAYFAST_PASSPHRASE: process.env.PAYFAST_PASSPHRASE || "",
  PAYFAST_PROCESS_URL: process.env.PAYFAST_PROCESS_URL || "",
  PAYFAST_ITN_URL: process.env.PAYFAST_ITN_URL || "",
  // Defaults to sandbox (true) — must be explicitly set to "false" to go
  // live with real payments. Drives both the process URL default and which
  // PayFast validate endpoint confirmWithPayFast() posts back to.
  PAYFAST_SANDBOX: process.env.PAYFAST_SANDBOX !== "false",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
  CRON_SECRET: process.env.CRON_SECRET || "",
  // S3-compatible object storage for digital product files (never public).
  // S3_ENDPOINT is optional — omit for real AWS S3, set it for Cloudflare
  // R2 / MinIO / any other S3-compatible provider.
  S3_ENDPOINT: process.env.S3_ENDPOINT || "",
  S3_BUCKET: process.env.S3_BUCKET || "",
  S3_REGION: process.env.S3_REGION || "auto",
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || "",
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || "",
};
