import { createHash } from "node:crypto";
import { env } from "@/lib/env";

type InitializePaymentInput = {
  amount: number;
  itemName: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  paymentId: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
};

export function getPayFastProcessUrl() {
  if (env.PAYFAST_PROCESS_URL) {
    return env.PAYFAST_PROCESS_URL;
  }

  return "https://sandbox.payfast.co.za/eng/process";
}

function createPayFastSignature(fields: Record<string, string>) {
  const sortedEntries = Object.entries(fields)
    .filter(([, value]) => value !== "")
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  const query = sortedEntries
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}`)
    .join("&");

  const withPassphrase = env.PAYFAST_PASSPHRASE
    ? `${query}&passphrase=${encodeURIComponent(env.PAYFAST_PASSPHRASE).replace(/%20/g, "+")}`
    : query;

  return createHash("md5").update(withPassphrase).digest("hex");
}

export function buildPayFastInitializePayload(input: InitializePaymentInput) {
  const fields = {
    merchant_id: env.PAYFAST_MERCHANT_ID,
    merchant_key: env.PAYFAST_MERCHANT_KEY,
    m_payment_id: input.paymentId,
    amount: input.amount.toFixed(2),
    item_name: input.itemName,
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    notify_url: input.notifyUrl,
    name_first: input.customerFirstName || "",
    name_last: input.customerLastName || "",
    email_address: input.customerEmail || "",
  };

  const signature = createPayFastSignature(fields);

  return {
    ...fields,
    signature,
  };
}
