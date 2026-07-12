// A payment link sent by email can only ever be clicked (a GET request) —
// PayFast requires a POST with signed form fields. This route looks up the
// pending Payment by reference, rebuilds the exact signed fields using the
// raw inputs stashed in Payment.metadata._redirect at creation time (see
// src/lib/payfast/initiate.ts), and returns a tiny auto-submitting HTML
// page that POSTs them to PayFast on load.
import { NextResponse } from "next/server";
import { withAdminContext } from "@/lib/tenant-prisma";
import { buildPayFastInitializePayload, getPayFastProcessUrl } from "@/lib/payfast/client";
import { getPayFastConfig } from "@/lib/payfast/config";

type Ctx = { params: Promise<{ reference: string }> };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request, ctx: Ctx) {
  const { reference } = await ctx.params;
  // Payment has FORCE ROW LEVEL SECURITY — this is a public, unauthenticated
  // GET (a clicked email link), so it must bypass RLS explicitly rather than
  // scope to a session that doesn't exist here.
  const payment = await withAdminContext((tx) => tx.payment.findUnique({ where: { reference } }));

  if (!payment) {
    return new NextResponse("Payment link not found.", { status: 404 });
  }
  if (payment.status === "COMPLETE") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const meta = (payment.metadata as Record<string, unknown> | null)?._redirect as
    | {
        itemName?: string;
        returnUrl?: string;
        cancelUrl?: string;
        customerFirstName?: string;
        customerLastName?: string;
        customerEmail?: string;
        subscriptionType?: 1;
        recurringAmount?: number;
        frequency?: 3 | 6;
        cycles?: number;
      }
    | undefined;

  if (!meta?.itemName || !meta.returnUrl || !meta.cancelUrl) {
    return new NextResponse("This payment link is missing required details.", { status: 500 });
  }

  const payFastConfig = await getPayFastConfig();
  const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/payfast/notify`;

  const fields = buildPayFastInitializePayload(
    {
      amount: Number(payment.amount),
      itemName: meta.itemName,
      returnUrl: meta.returnUrl,
      cancelUrl: meta.cancelUrl,
      notifyUrl,
      paymentId: payment.reference,
      customerFirstName: meta.customerFirstName,
      customerLastName: meta.customerLastName,
      customerEmail: meta.customerEmail,
      subscriptionType: meta.subscriptionType,
      recurringAmount: meta.recurringAmount,
      frequency: meta.frequency,
      cycles: meta.cycles,
    },
    payFastConfig,
  );

  const processUrl = getPayFastProcessUrl(payFastConfig);
  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirecting to PayFast…</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:80px 20px;color:#5d7497;">
  <p>Redirecting you to PayFast to complete your payment…</p>
  <form id="pf" method="POST" action="${escapeHtml(processUrl)}">
    ${inputs}
  </form>
  <script>document.getElementById('pf').submit();</script>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
