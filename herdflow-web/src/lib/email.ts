/**
 * HerdFlow Email Service
 *
 * Uses Resend (resend.com) when RESEND_API_KEY is set.
 * Falls back to console logging in development.
 *
 * Setup:
 *  1. Sign up free at resend.com
 *  2. Add domain herdflow.co.za in dashboard
 *  3. Set RESEND_API_KEY in .env
 *  4. Set EMAIL_FROM=noreply@herdflow.co.za in .env
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "HerdFlow <noreply@herdflow.co.za>";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    // Development fallback: log to console
    console.log("\n─── EMAIL (dev mode — no RESEND_API_KEY) ───");
    console.log(`To:      ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Text:\n${payload.text}`);
    console.log("────────────────────────────────────────────\n");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Resend email error:", err);
    throw new Error("Failed to send email");
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
  expiresIn: string;
}): Promise<void> {
  const { to, name, resetUrl, expiresIn } = opts;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ef;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4ebf5;">
        <!-- Header -->
        <tr>
          <td style="background:#1B3A6B;padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#d9c08f;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">HerdFlow</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:900;">Reset Your Password</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;color:#244367;font-size:15px;">Hi ${name},</p>
            <p style="margin:0 0 16px;color:#5d7497;font-size:14px;line-height:1.6;">
              We received a request to reset the password for your HerdFlow account.
              Click the button below to create a new password.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#2E7D32;color:#ffffff;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:1px;padding:14px 36px;border-radius:10px;text-decoration:none;">
                Reset My Password
              </a>
            </div>
            <p style="margin:0 0 8px;color:#9aabb9;font-size:13px;">This link expires in <strong>${expiresIn}</strong>.</p>
            <p style="margin:0 0 24px;color:#9aabb9;font-size:13px;">
              If you did not request a password reset you can safely ignore this email.
              Your password will not be changed.
            </p>
            <div style="background:#f5f8fd;border-radius:10px;padding:16px;">
              <p style="margin:0;color:#9aabb9;font-size:12px;">
                🔒 HerdFlow will never ask for your password via email or phone.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f5f8fd;padding:20px 32px;border-top:1px solid #e4ebf5;text-align:center;">
            <p style="margin:0;color:#9aabb9;font-size:11px;">
              © 2026 HerdFlow — A division of Geyer Holdings<br>
              North West Province, South Africa
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Reset your HerdFlow password

Hi ${name},

We received a request to reset your HerdFlow password.

Visit this link to reset your password:
${resetUrl}

This link expires in ${expiresIn}.

If you did not request this, please ignore this email.

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: "Reset Your HerdFlow Password", html, text });
}

function documentEmailHtml(opts: {
  heading: string;
  greetingName: string;
  bodyLines: string[];
  amountLabel: string;
  viewUrl: string;
  buttonLabel: string;
}): string {
  const { heading, greetingName, bodyLines, amountLabel, viewUrl, buttonLabel } = opts;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ef;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4ebf5;">
        <tr>
          <td style="background:#1B3A6B;padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#d9c08f;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">HerdFlow</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:900;">${heading}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;color:#244367;font-size:15px;">Hi ${greetingName},</p>
            ${bodyLines.map((line) => `<p style="margin:0 0 16px;color:#5d7497;font-size:14px;line-height:1.6;">${line}</p>`).join("")}
            <p style="margin:0 0 24px;color:#244367;font-size:16px;font-weight:bold;">${amountLabel}</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${viewUrl}" style="display:inline-block;background:#2E7D32;color:#ffffff;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:1px;padding:14px 36px;border-radius:10px;text-decoration:none;">
                ${buttonLabel}
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f8fd;padding:20px 32px;border-top:1px solid #e4ebf5;text-align:center;">
            <p style="margin:0;color:#9aabb9;font-size:11px;">
              © 2026 HerdFlow — A division of Geyer Holdings<br>
              North West Province, South Africa
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendQuoteEmail(opts: {
  to: string;
  sponsorName: string;
  quoteNumber: string;
  amountLabel: string;
  viewUrl: string;
  validUntil: string;
}): Promise<void> {
  const { to, sponsorName, quoteNumber, amountLabel, viewUrl, validUntil } = opts;

  const html = documentEmailHtml({
    heading: "Your HerdFlow Sponsorship Quote",
    greetingName: sponsorName,
    bodyLines: [
      `Thanks for your interest in sponsoring HerdFlow. Quote <strong>${quoteNumber}</strong> is ready for your review.`,
      `This quote is valid until <strong>${validUntil}</strong>.`,
    ],
    amountLabel,
    viewUrl,
    buttonLabel: "View Quote",
  });

  const text = `Your HerdFlow Sponsorship Quote

Hi ${sponsorName},

Quote ${quoteNumber} is ready for your review.
${amountLabel}
Valid until ${validUntil}.

View it here: ${viewUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `HerdFlow Sponsorship Quote ${quoteNumber}`, html, text });
}

export async function sendInvoiceEmail(opts: {
  to: string;
  sponsorName: string;
  invoiceNumber: string;
  amountLabel: string;
  viewUrl: string;
  dueDate: string;
}): Promise<void> {
  const { to, sponsorName, invoiceNumber, amountLabel, viewUrl, dueDate } = opts;

  const html = documentEmailHtml({
    heading: "Your HerdFlow Invoice",
    greetingName: sponsorName,
    bodyLines: [
      `Invoice <strong>${invoiceNumber}</strong> has been issued for your HerdFlow sponsorship.`,
      `Payment is due by <strong>${dueDate}</strong>. Banking details are on the invoice.`,
    ],
    amountLabel,
    viewUrl,
    buttonLabel: "View Invoice",
  });

  const text = `Your HerdFlow Invoice

Hi ${sponsorName},

Invoice ${invoiceNumber} has been issued for your HerdFlow sponsorship.
${amountLabel}
Due by ${dueDate}.

View it here: ${viewUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `HerdFlow Invoice ${invoiceNumber}`, html, text });
}

export async function sendVendorRegistrationFeeEmail(opts: {
  to: string;
  sellerName: string;
  amountLabel: string;
  payUrl: string;
}): Promise<void> {
  const { to, sellerName, amountLabel, payUrl } = opts;

  const html = documentEmailHtml({
    heading: "You're Approved — Complete Your Registration",
    greetingName: sellerName,
    bodyLines: [
      `Great news — your HerdFlow seller application has been approved.`,
      `To activate your storefront and start listing, please pay the one-time registration fee below.`,
    ],
    amountLabel,
    viewUrl: payUrl,
    buttonLabel: "Pay Registration Fee",
  });

  const text = `You're Approved — Complete Your Registration

Hi ${sellerName},

Your HerdFlow seller application has been approved.
To activate your storefront, pay the one-time registration fee: ${amountLabel}

Pay here: ${payUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: "You're approved — activate your HerdFlow storefront", html, text });
}

export async function sendPayoutRemittanceEmail(opts: {
  to: string;
  sellerName: string;
  payoutNumber: string;
  amountLabel: string;
  paidDate: string;
}): Promise<void> {
  const { to, sellerName, payoutNumber, amountLabel, paidDate } = opts;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ef;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4ebf5;">
        <tr>
          <td style="background:#1B3A6B;padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#d9c08f;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">HerdFlow</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:900;">Payout Sent</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;color:#244367;font-size:15px;">Hi ${sellerName},</p>
            <p style="margin:0 0 16px;color:#5d7497;font-size:14px;line-height:1.6;">
              Payout <strong>${payoutNumber}</strong> was paid to your bank account on <strong>${paidDate}</strong>.
            </p>
            <p style="margin:0 0 24px;color:#244367;font-size:16px;font-weight:bold;">${amountLabel}</p>
            <div style="background:#f5f8fd;border-radius:10px;padding:16px;">
              <p style="margin:0;color:#9aabb9;font-size:12px;">
                If this doesn't reflect in your account within 2–3 business days, contact info@herdflow.co.za.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f8fd;padding:20px 32px;border-top:1px solid #e4ebf5;text-align:center;">
            <p style="margin:0;color:#9aabb9;font-size:11px;">
              © 2026 HerdFlow — A division of Geyer Holdings<br>
              North West Province, South Africa
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Payout Sent

Hi ${sellerName},

Payout ${payoutNumber} was paid to your bank account on ${paidDate}.
Amount: ${amountLabel}

If this doesn't reflect within 2-3 business days, contact info@herdflow.co.za.

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `HerdFlow Payout ${payoutNumber} Sent`, html, text });
}

export async function sendSellerSaleNotification(opts: {
  to: string;
  sellerName: string;
  orderNumber: string;
  items: Array<{ productName: string; quantity: number }>;
  netAmountLabel: string;
  dashboardUrl: string;
}): Promise<void> {
  const { to, sellerName, orderNumber, items, netAmountLabel, dashboardUrl } = opts;

  const itemLines = items.map((i) => `${i.quantity} x ${i.productName}`).join(", ");

  const html = documentEmailHtml({
    heading: "You Made a Sale!",
    greetingName: sellerName,
    bodyLines: [
      `Order <strong>${orderNumber}</strong> just sold: ${itemLines}.`,
      `Your net earnings (after HerdFlow's commission) are shown below. Check your dashboard for full order details and payout status.`,
    ],
    amountLabel: netAmountLabel,
    viewUrl: dashboardUrl,
    buttonLabel: "View My Dashboard",
  });

  const text = `You Made a Sale!

Hi ${sellerName},

Order ${orderNumber} just sold: ${itemLines}.
Your net earnings: ${netAmountLabel}

View your dashboard: ${dashboardUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `You made a sale on HerdFlow — ${orderNumber}`, html, text });
}

export async function sendOrderConfirmationEmail(opts: {
  to: string;
  buyerName: string;
  orderNumber: string;
  totalLabel: string;
  trackingUrl: string;
}): Promise<void> {
  const { to, buyerName, orderNumber, totalLabel, trackingUrl } = opts;

  const html = documentEmailHtml({
    heading: "Order Confirmed",
    greetingName: buyerName,
    bodyLines: [
      `Thanks for your order! <strong>${orderNumber}</strong> is confirmed and being prepared by the seller.`,
      `You can track its status any time from your order history.`,
    ],
    amountLabel: totalLabel,
    viewUrl: trackingUrl,
    buttonLabel: "Track My Order",
  });

  const text = `Order Confirmed

Hi ${buyerName},

Thanks for your order! ${orderNumber} is confirmed and being prepared by the seller.
Total: ${totalLabel}

Track it here: ${trackingUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `Your HerdFlow order ${orderNumber} is confirmed`, html, text });
}

export async function sendListingLiveEmail(opts: {
  to: string;
  sellerName: string;
  listingTitle: string;
  viewUrl: string;
}): Promise<void> {
  const { to, sellerName, listingTitle, viewUrl } = opts;

  const html = documentEmailHtml({
    heading: "Your Listing Is Live",
    greetingName: sellerName,
    bodyLines: [
      `Your listing <strong>${listingTitle}</strong> is now live on the HerdFlow marketplace.`,
      `Buyers can now view your listing and contact you directly via WhatsApp or phone.`,
    ],
    amountLabel: "",
    viewUrl,
    buttonLabel: "View My Listing",
  });

  const text = `Your Listing Is Live

Hi ${sellerName},

Your listing "${listingTitle}" is now live on the HerdFlow marketplace.
Buyers can now view it and contact you directly.

View it here: ${viewUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `Your listing "${listingTitle}" is live on HerdFlow`, html, text });
}

export async function sendListingExpiringEmail(opts: {
  to: string;
  sellerName: string;
  listingTitle: string;
  expiresDate: string;
  renewUrl: string;
}): Promise<void> {
  const { to, sellerName, listingTitle, expiresDate, renewUrl } = opts;

  const html = documentEmailHtml({
    heading: "Your Listing Expires Soon",
    greetingName: sellerName,
    bodyLines: [
      `Your listing <strong>${listingTitle}</strong> expires on <strong>${expiresDate}</strong> — in 3 days.`,
      `Create a new listing before then to keep it visible to buyers.`,
    ],
    amountLabel: "",
    viewUrl: renewUrl,
    buttonLabel: "Renew My Listing",
  });

  const text = `Your Listing Expires Soon

Hi ${sellerName},

Your listing "${listingTitle}" expires on ${expiresDate} — in 3 days.
Create a new listing before then to keep it visible to buyers.

Renew here: ${renewUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `Your HerdFlow listing expires in 3 days`, html, text });
}

export async function sendBookingConfirmedEmail(opts: {
  to: string;
  recipientName: string;
  isPartner: boolean;
  bookingNumber: string;
  route: string;
  viewUrl: string;
}): Promise<void> {
  const { to, recipientName, isPartner, bookingNumber, route, viewUrl } = opts;
  const heading = "Transport Booking Confirmed";
  const bodyLines = isPartner
    ? [
        `You've been assigned delivery <strong>${bookingNumber}</strong>: ${route}.`,
        `Please contact the farmer to arrange pickup details.`,
      ]
    : [
        `Your transport booking <strong>${bookingNumber}</strong> has been confirmed: ${route}.`,
        `A HerdFlow logistics partner has been assigned and will be in touch to arrange pickup.`,
      ];

  const html = documentEmailHtml({
    heading,
    greetingName: recipientName,
    bodyLines,
    amountLabel: "",
    viewUrl,
    buttonLabel: "View Booking",
  });

  const text = `${heading}

Hi ${recipientName},

${bodyLines.join("\n").replace(/<\/?strong>/g, "")}

View it here: ${viewUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `HerdFlow Transport Booking ${bookingNumber} Confirmed`, html, text });
}

export async function sendTrialEndingEmail(opts: {
  to: string;
  userName: string;
  planName: string;
  trialEndsDate: string;
  billingUrl: string;
}): Promise<void> {
  const { to, userName, planName, trialEndsDate, billingUrl } = opts;

  const html = documentEmailHtml({
    heading: "Your Trial Is Ending Soon",
    greetingName: userName,
    bodyLines: [
      `Your <strong>${planName}</strong> trial ends on <strong>${trialEndsDate}</strong> — in 7 days.`,
      `Make sure your payment details are up to date so your plan continues without interruption.`,
    ],
    amountLabel: "",
    viewUrl: billingUrl,
    buttonLabel: "Manage My Plan",
  });

  const text = `Your Trial Is Ending Soon

Hi ${userName},

Your ${planName} trial ends on ${trialEndsDate} — in 7 days.
Make sure your payment details are up to date so your plan continues without interruption.

Manage your plan: ${billingUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `Your HerdFlow trial ends in 7 days`, html, text });
}
