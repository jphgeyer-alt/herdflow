import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "hf_admin_session";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "change-this-admin-secret";
}

function getConfiguredUsername() {
  return process.env.ADMIN_USERNAME || "admin";
}

function getConfiguredPassword() {
  return process.env.ADMIN_PASSWORD || "admin1234";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function timingSafeStringEqual(a: string, b: string) {
  const aHash = createHmac("sha256", getSecret()).update(a).digest();
  const bHash = createHmac("sha256", getSecret()).update(b).digest();
  return timingSafeEqual(aHash, bHash);
}

export function validateAdminCredentials(username: string, password: string) {
  const userOk = timingSafeStringEqual(username, getConfiguredUsername());
  const passOk = timingSafeStringEqual(password, getConfiguredPassword());
  return userOk && passOk;
}

export function createAdminSessionValue() {
  const username = getConfiguredUsername();
  const signature = sign(username);
  return `${username}.${signature}`;
}

export function isValidAdminSession(sessionValue?: string) {
  if (!sessionValue) {
    return false;
  }

  const [username, providedSignature] = sessionValue.split(".");

  if (!username || !providedSignature || username !== getConfiguredUsername()) {
    return false;
  }

  const expectedSignature = sign(username);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function getAdminUsername(sessionValue?: string): string {
  return sessionValue?.split(".")[0] || "admin";
}
