import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "hf_admin_session";

const INSECURE_DEFAULT_SECRET = "change-this-admin-secret";
const INSECURE_DEFAULT_PASSWORD = "admin1234";

function failFastInProduction(value: string, insecureDefault: string, envVarName: string) {
  if (process.env.NODE_ENV === "production" && value === insecureDefault) {
    throw new Error(
      `${envVarName} must be set to a strong, non-default value in production. Refusing to start with the insecure fallback.`,
    );
  }
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || INSECURE_DEFAULT_SECRET;
  failFastInProduction(secret, INSECURE_DEFAULT_SECRET, "ADMIN_SESSION_SECRET");
  return secret;
}

function getConfiguredUsername() {
  return process.env.ADMIN_USERNAME || "admin";
}

function getConfiguredPassword() {
  const password = process.env.ADMIN_PASSWORD || INSECURE_DEFAULT_PASSWORD;
  failFastInProduction(password, INSECURE_DEFAULT_PASSWORD, "ADMIN_PASSWORD");
  return password;
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
