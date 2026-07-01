import { NextResponse } from "next/server";
import { buildPayFastInitializePayload, getPayFastProcessUrl } from "@/lib/payfast/client";

type InitializeBody = {
  amount?: number;
  itemName?: string;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
  paymentId?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as InitializeBody;

  if (!body.amount || body.amount <= 0 || !body.itemName || !body.returnUrl || !body.cancelUrl || !body.notifyUrl) {
    return NextResponse.json(
      { error: "amount, itemName, returnUrl, cancelUrl, and notifyUrl are required." },
      { status: 400 },
    );
  }

  const paymentId = body.paymentId || `HF-${Date.now()}`;
  const fields = buildPayFastInitializePayload({
    amount: body.amount,
    itemName: body.itemName,
    returnUrl: body.returnUrl,
    cancelUrl: body.cancelUrl,
    notifyUrl: body.notifyUrl,
    paymentId,
    customerFirstName: body.customerFirstName,
    customerLastName: body.customerLastName,
    customerEmail: body.customerEmail,
  });

  return NextResponse.json({
    provider: "PayFast",
    processUrl: getPayFastProcessUrl(),
    fields,
  });
}
