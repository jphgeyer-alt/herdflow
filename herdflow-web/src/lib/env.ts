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
};
