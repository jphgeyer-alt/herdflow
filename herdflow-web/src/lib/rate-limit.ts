// WEBSITE — herdflow-web/src/lib/rate-limit.ts
// Simple in-memory rate limiting — resets on server restart, good enough
// without standing up Redis. Extracted from forgot-password/route.ts (the
// original implementation) so login and any future endpoint share the same
// logic instead of re-implementing the same Map-based counter each time.
const stores = new Map<string, Map<string, { count: number; resetAt: number }>>();

function getStore(name: string) {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

/** Returns true if `key` (within the named bucket) has exceeded maxRequests
 * in the current windowMs — i.e. true means "reject this request". */
export function checkRateLimit(
  bucket: string,
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const store = getStore(bucket);
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= maxRequests) return true;
  entry.count++;
  return false;
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

interface FailureEntry {
  count: number;
  windowResetAt: number;
  lockedUntil: number | null;
}
const failureStores = new Map<string, Map<string, FailureEntry>>();

function getFailureStore(bucket: string) {
  let store = failureStores.get(bucket);
  if (!store) {
    store = new Map();
    failureStores.set(bucket, store);
  }
  return store;
}

/** For login-style lockouts: only counts calls the caller identifies as a
 * failure (unlike checkRateLimit, which counts every call regardless of
 * outcome) — a correct password on the first try never gets throttled.
 * `lockedUntil` is tracked separately from the failure-counting window, so
 * a single early failure is never mistaken for an active lockout. */
export function isLockedOut(bucket: string, key: string): boolean {
  const entry = getFailureStore(bucket).get(key);
  return !!entry?.lockedUntil && entry.lockedUntil > Date.now();
}

export function recordFailedAttempt(
  bucket: string,
  key: string,
  maxFailures: number,
  windowMs: number,
  lockoutMs: number,
): boolean {
  const store = getFailureStore(bucket);
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || entry.windowResetAt < now) {
    entry = { count: 0, windowResetAt: now + windowMs, lockedUntil: null };
  }
  entry.count++;
  if (entry.count >= maxFailures) {
    entry.lockedUntil = now + lockoutMs;
  }
  store.set(key, entry);
  return !!entry.lockedUntil && entry.lockedUntil > now;
}

export function clearFailedAttempts(bucket: string, key: string): void {
  getFailureStore(bucket).delete(key);
}
