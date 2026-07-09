import { createHash } from "node:crypto";
import type { PayFastConfig } from "@/lib/payfast/config";

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

const DEFAULT_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";

export function getPayFastProcessUrl(config?: Pick<PayFastConfig, "processUrl">) {
  if (config?.processUrl) {
    return config.processUrl;
  }

  return DEFAULT_PROCESS_URL;
}

export function createPayFastSignature(fields: Record<string, string>, passphrase?: string) {
  const sortedEntries = Object.entries(fields)
    .filter(([, value]) => value !== "")
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  const query = sortedEntries
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}`)
    .join("&");

  const withPassphrase = passphrase
    ? `${query}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    : query;

  return createHash("md5").update(withPassphrase).digest("hex");
}

export function buildPayFastInitializePayload(
  input: InitializePaymentInput,
  config: PayFastConfig,
) {
  const fields = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
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

  const signature = createPayFastSignature(fields, config.passphrase);

  return {
    ...fields,
    signature,
  };
}
