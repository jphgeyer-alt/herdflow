// Shared "create a Payment row, then build the signed PayFast redirect"
// helper — every payable action (checkout, listing fee, transport booking,
// vendor registration, subscription, sponsor invoice) follows this same
// shape, so each wiring route calls this instead of repeating it.
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { buildPayFastInitializePayload, getPayFastProcessUrl } from "@/lib/payfast/client";
import { getPayFastConfig } from "@/lib/payfast/config";
import type { PaymentType, Prisma } from "@prisma/client";

export type InitiatePaymentInput = {
  reference: string; // must be unique — caller decides (e.g. Order.orderNumber, or a generated one)
  amount: number;
  itemName: string;
  paymentType: PaymentType;
  returnUrl: string;
  cancelUrl: string;
  userId?: string;
  orderId?: string;
  listingId?: string;
  deliveryRequestId?: string;
  invoiceId?: string;
  subscriptionId?: string;
  sellerId?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
  // Recurring billing (subscriptions only)
  subscriptionType?: 1;
  recurringAmount?: number;
  frequency?: 3 | 6;
  cycles?: number;
};

export async function initiatePayment(input: InitiatePaymentInput) {
  const payFastConfig = await getPayFastConfig();
  if (!payFastConfig.merchantId || !payFastConfig.merchantKey) {
    throw new Error("PayFast merchant configuration is missing.");
  }

  const notifyUrl = `${env.NEXT_PUBLIC_SITE_URL || ""}/api/payfast/notify`;

  // Stashing the raw redirect inputs lets /api/payfast/redirect/[reference]
  // rebuild the exact same signed form later — needed for emailed payment
  // links, which can only ever be a GET click, not a POST form submit.
  const metadata = {
    ...input.metadata,
    _redirect: {
      itemName: input.itemName,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      customerFirstName: input.customerFirstName,
      customerLastName: input.customerLastName,
      customerEmail: input.customerEmail,
      subscriptionType: input.subscriptionType,
      recurringAmount: input.recurringAmount,
      frequency: input.frequency,
      cycles: input.cycles,
    },
  };

  await prisma.payment.upsert({
    where: { reference: input.reference },
    update: {
      amount: input.amount,
      status: "PENDING",
      metadata: metadata as Prisma.InputJsonValue,
    },
    create: {
      reference: input.reference,
      amount: input.amount,
      paymentType: input.paymentType,
      status: "PENDING",
      userId: input.userId,
      orderId: input.orderId,
      listingId: input.listingId,
      deliveryRequestId: input.deliveryRequestId,
      invoiceId: input.invoiceId,
      subscriptionId: input.subscriptionId,
      sellerId: input.sellerId,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  const fields = buildPayFastInitializePayload(
    {
      amount: input.amount,
      itemName: input.itemName,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      notifyUrl,
      paymentId: input.reference,
      customerFirstName: input.customerFirstName,
      customerLastName: input.customerLastName,
      customerEmail: input.customerEmail,
      subscriptionType: input.subscriptionType,
      recurringAmount: input.recurringAmount,
      frequency: input.frequency,
      cycles: input.cycles,
    },
    payFastConfig,
  );

  return {
    processUrl: getPayFastProcessUrl(payFastConfig),
    fields,
  };
}
