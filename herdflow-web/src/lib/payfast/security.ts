// Server-side ITN hardening, per PayFast's documented integration security
// steps: (1) verify the signature (already done in the notify route),
// (2) verify the source IP actually belongs to PayFast, (3) post the raw
// ITN data back to PayFast and require a "VALID" confirmation before
// trusting it. Skipping (2)/(3) was the gap found in this codebase — a
// correct signature alone doesn't prove the request came from PayFast's
// servers rather than a replay/forgery from an attacker who obtained a
// valid signature some other way (e.g. a leaked passphrase).
import { lookup } from "node:dns/promises";

// PayFast's own documented list of ITN-sending hostnames.
const PAYFAST_HOSTNAMES = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];

export async function isValidPayFastSourceIp(requestIp: string | null): Promise<boolean> {
  if (!requestIp) return false;
  // Strip a possible ::ffff: IPv4-mapped-IPv6 prefix.
  const ip = requestIp.replace(/^::ffff:/, "");

  try {
    const results = await Promise.all(
      PAYFAST_HOSTNAMES.map((host) =>
        lookup(host, { all: true }).catch(() => [] as { address: string }[]),
      ),
    );
    const validIps = new Set(results.flat().map((r) => r.address));
    return validIps.has(ip);
  } catch {
    // DNS lookup itself failed — fail closed (treat as invalid) rather than
    // silently skipping the check.
    return false;
  }
}

export function getRequestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

// Server-to-server confirmation: PayFast requires posting the exact raw ITN
// body back to their validate endpoint and checking for a "VALID" response
// before trusting the notification — this is what actually rules out a
// forged/replayed POST with a stale-but-correct signature.
export async function confirmWithPayFast(rawBody: string, sandbox: boolean): Promise<boolean> {
  const validateUrl = sandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";

  try {
    const res = await fetch(validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const text = (await res.text()).trim();
    return text === "VALID";
  } catch {
    return false;
  }
}
