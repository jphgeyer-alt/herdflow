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
  // Recurring billing (subscriptions) — PayFast's own frequency codes:
  // 3 = monthly, 6 = annual. cycles=0 means "bill indefinitely".
  subscriptionType?: 1;
  recurringAmount?: number;
  frequency?: 3 | 6;
  cycles?: number;
};

const DEFAULT_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";

export function getPayFastProcessUrl(config?: Pick<PayFastConfig, "processUrl">) {
  if (config?.processUrl) {
    return config.processUrl;
  }

  return DEFAULT_PROCESS_URL;
}

// IMPORTANT: PayFast computes its signature over fields in the order they
// were declared on the checkout form (outgoing) / the order they arrive in
// the ITN POST body (incoming) — NOT alphabetically sorted. This previously
// sorted alphabetically, which never matches PayFast's own signature either
// direction (confirmed against PayFast's published integration docs).
// `fields` here must already be in the correct order — since JS preserves
// string-key insertion order, callers control this by how they build the
// object (see buildPayFastInitializePayload below, and the ITN handler
// which builds its object directly from the parsed POST body in wire order).
export function createPayFastSignature(fields: Record<string, string>, passphrase?: string) {
  const orderedEntries = Object.entries(fields).filter(
    ([, value]) => value !== "" && value != null,
  );

  const query = orderedEntries
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
  // Field order matches PayFast's documented checkout-form field order
  // exactly (merchant details -> return/cancel/notify -> buyer details ->
  // transaction details -> recurring billing) — this order is what the
  // signature is computed over, so it must not be reshuffled casually.
  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    notify_url: input.notifyUrl,
    name_first: input.customerFirstName || "",
    name_last: input.customerLastName || "",
    email_address: input.customerEmail || "",
    m_payment_id: input.paymentId,
    amount: input.amount.toFixed(2),
    item_name: input.itemName,
  };

  if (input.subscriptionType) {
    fields.subscription_type = String(input.subscriptionType);
    fields.recurring_amount = (input.recurringAmount ?? input.amount).toFixed(2);
    fields.frequency = String(input.frequency ?? 3);
    fields.cycles = String(input.cycles ?? 0);
  }

  const signature = createPayFastSignature(fields, config.passphrase);

  return {
    ...fields,
    signature,
  };
}
