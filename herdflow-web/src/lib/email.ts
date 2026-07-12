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

export async function sendLeadToPartnerEmail(opts: {
  to: string;
  partnerName: string;
  categoryName: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  province: string;
  farmName?: string;
  amountLabel?: string;
  message?: string;
}): Promise<void> {
  const { to, partnerName, categoryName, leadName, leadPhone, leadEmail, province, farmName, amountLabel, message } =
    opts;

  const html = documentEmailHtml({
    heading: `New ${categoryName} Lead`,
    greetingName: partnerName,
    bodyLines: [
      `A HerdFlow farmer has requested a quote for <strong>${categoryName}</strong>.`,
      `Name: ${leadName}<br>Phone: ${leadPhone}${leadEmail ? `<br>Email: ${leadEmail}` : ""}<br>Province: ${province}${farmName ? `<br>Farm: ${farmName}` : ""}`,
      message ? `Message: ${message}` : "",
    ].filter(Boolean),
    amountLabel: amountLabel || "",
    viewUrl: "https://www.herdflow.co.za/admin/leads",
    buttonLabel: "View in HerdFlow",
  });

  const text = `New ${categoryName} Lead

Hi ${partnerName},

A HerdFlow farmer has requested a quote for ${categoryName}.

Name: ${leadName}
Phone: ${leadPhone}
${leadEmail ? `Email: ${leadEmail}\n` : ""}Province: ${province}
${farmName ? `Farm: ${farmName}\n` : ""}${message ? `Message: ${message}\n` : ""}
— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `New ${categoryName} Lead — ${leadName}`, html, text });
}

export async function sendLeadConfirmationEmail(opts: {
  to: string;
  leadName: string;
  categoryName: string;
  partnerName: string;
}): Promise<void> {
  const { to, leadName, categoryName, partnerName } = opts;

  const html = documentEmailHtml({
    heading: "Quote Request Received",
    greetingName: leadName,
    bodyLines: [
      `Thanks for your ${categoryName} quote request. We've referred your details to <strong>${partnerName}</strong>, an independent provider, who will contact you directly.`,
      `HerdFlow is not a Financial Services Provider and does not provide financial advice or intermediary services. HerdFlow may receive a referral fee from partners.`,
    ],
    amountLabel: "",
    viewUrl: "https://www.herdflow.co.za/finance",
    buttonLabel: "Back to Farm Finance",
  });

  const text = `Quote Request Received

Hi ${leadName},

Thanks for your ${categoryName} quote request. We've referred your details to ${partnerName}, an independent provider, who will contact you directly.

HerdFlow is not a Financial Services Provider and does not provide financial advice or intermediary services. HerdFlow may receive a referral fee from partners.

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `Your ${categoryName} quote request — HerdFlow`, html, text });
}

export async function sendDigitalProductEmail(opts: {
  to: string;
  buyerName: string;
  productTitle: string;
  downloadUrl: string;
  expiresDate: string;
  maxDownloads: number;
}): Promise<void> {
  const { to, buyerName, productTitle, downloadUrl, expiresDate, maxDownloads } = opts;

  const html = documentEmailHtml({
    heading: "Your Download Is Ready",
    greetingName: buyerName,
    bodyLines: [
      `Thanks for your purchase! <strong>${productTitle}</strong> is ready to download.`,
      `This link works up to ${maxDownloads} times and expires on <strong>${expiresDate}</strong>.`,
    ],
    amountLabel: "",
    viewUrl: downloadUrl,
    buttonLabel: "Download Now",
  });

  const text = `Your Download Is Ready

Hi ${buyerName},

Thanks for your purchase! ${productTitle} is ready to download.
This link works up to ${maxDownloads} times and expires on ${expiresDate}.

Download here: ${downloadUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: `Your HerdFlow download: ${productTitle}`, html, text });
}

export async function sendDirectoryPaymentEmail(opts: {
  to: string;
  businessName: string;
  planLabel: string;
  amountLabel: string;
  payUrl: string;
}): Promise<void> {
  const { to, businessName, planLabel, amountLabel, payUrl } = opts;

  const html = documentEmailHtml({
    heading: "You're Approved — Activate Your Listing",
    greetingName: businessName,
    bodyLines: [
      `Great news — your Services Directory application has been approved.`,
      `To go live, please set up your <strong>${planLabel}</strong> monthly subscription below. This will bill automatically each month until cancelled.`,
    ],
    amountLabel: `${amountLabel} / month`,
    viewUrl: payUrl,
    buttonLabel: "Activate My Listing",
  });

  const text = `You're Approved — Activate Your Listing

Hi ${businessName},

Your Services Directory application has been approved.
To go live, set up your ${planLabel} monthly subscription: ${amountLabel} / month

Activate here: ${payUrl}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: "You're approved — activate your HerdFlow Directory listing", html, text });
}

export async function sendWeeklyMarketPriceEmail(opts: {
  to: string;
  farmerName: string;
  prices: {
    beef: { a23: number; b23: number; c23: number; weanerCalves: number; unit: string };
    mutton: { a23: number; b23: number; c23: number; feederLamb: number; unit: string };
    feed: { safexMaize: number; unit: string };
  };
  sponsor?: { name: string; imageUrl: string; linkUrl: string } | null;
  unsubscribeNote: string;
}): Promise<void> {
  const { to, farmerName, prices, sponsor, unsubscribeNote } = opts;

  const priceRows = `
    <tr><td style="padding:6px 0;color:#5d7497;font-size:13px;">Beef A23 / B23 / C23</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:#244367;font-size:13px;">R${prices.beef.a23} / R${prices.beef.b23} / R${prices.beef.c23}</td></tr>
    <tr><td style="padding:6px 0;color:#5d7497;font-size:13px;">Weaner Calves</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:#244367;font-size:13px;">R${prices.beef.weanerCalves}</td></tr>
    <tr><td style="padding:6px 0;color:#5d7497;font-size:13px;">Mutton A23 / B23 / C23</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:#244367;font-size:13px;">R${prices.mutton.a23} / R${prices.mutton.b23} / R${prices.mutton.c23}</td></tr>
    <tr><td style="padding:6px 0;color:#5d7497;font-size:13px;">Feeder Lamb</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:#244367;font-size:13px;">R${prices.mutton.feederLamb}</td></tr>
    <tr><td style="padding:6px 0;color:#5d7497;font-size:13px;">SAFEX Maize</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:#244367;font-size:13px;">R${prices.feed.safexMaize}/ton</td></tr>
  `;

  const sponsorBlock = sponsor
    ? `<tr><td style="padding-top:20px;">
         <p style="margin:0 0 6px;color:#9aabb9;font-size:10px;text-transform:uppercase;letter-spacing:1px;">In partnership with ${sponsor.name}</p>
         <a href="${sponsor.linkUrl}"><img src="${sponsor.imageUrl}" alt="${sponsor.name}" style="max-width:100%;border-radius:8px;" /></a>
       </td></tr>`
    : "";

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
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:900;">This Week's Market Prices</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;color:#244367;font-size:15px;">Hi ${farmerName},</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4ebf5;padding-top:8px;">
              ${priceRows}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">${sponsorBlock}</table>
            <p style="margin:20px 0 0;color:#9aabb9;font-size:11px;">${unsubscribeNote}</p>
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

  const text = `This Week's Market Prices

Hi ${farmerName},

Beef A23/B23/C23: R${prices.beef.a23} / R${prices.beef.b23} / R${prices.beef.c23}
Weaner Calves: R${prices.beef.weanerCalves}
Mutton A23/B23/C23: R${prices.mutton.a23} / R${prices.mutton.b23} / R${prices.mutton.c23}
Feeder Lamb: R${prices.mutton.feederLamb}
SAFEX Maize: R${prices.feed.safexMaize}/ton

${sponsor ? `In partnership with ${sponsor.name}\n\n` : ""}${unsubscribeNote}

— HerdFlow Team
© 2026 HerdFlow, a division of Geyer Holdings`;

  await sendEmail({ to, subject: "This Week's Market Prices — HerdFlow", html, text });
}
