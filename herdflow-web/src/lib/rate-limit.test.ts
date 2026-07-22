// Pure logic, no DB dependency — unlike the route integration tests in this
// repo, this can actually run locally without touching any database.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  isLockedOut,
  recordFailedAttempt,
  clearFailedAttempts,
} from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows requests under the limit", () => {
    const bucket = `test-${Math.random()}`;
    expect(checkRateLimit(bucket, "1.2.3.4", 3, 1000)).toBe(false);
    expect(checkRateLimit(bucket, "1.2.3.4", 3, 1000)).toBe(false);
    expect(checkRateLimit(bucket, "1.2.3.4", 3, 1000)).toBe(false);
  });

  it("rejects once the limit is exceeded", () => {
    const bucket = `test-${Math.random()}`;
    checkRateLimit(bucket, "1.2.3.4", 2, 1000);
    checkRateLimit(bucket, "1.2.3.4", 2, 1000);
    expect(checkRateLimit(bucket, "1.2.3.4", 2, 1000)).toBe(true);
  });

  it("resets after the window passes", () => {
    const bucket = `test-${Math.random()}`;
    checkRateLimit(bucket, "1.2.3.4", 1, 1000);
    expect(checkRateLimit(bucket, "1.2.3.4", 1, 1000)).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit(bucket, "1.2.3.4", 1, 1000)).toBe(false);
  });

  it("tracks different keys independently", () => {
    const bucket = `test-${Math.random()}`;
    checkRateLimit(bucket, "1.1.1.1", 1, 1000);
    expect(checkRateLimit(bucket, "1.1.1.1", 1, 1000)).toBe(true);
    expect(checkRateLimit(bucket, "2.2.2.2", 1, 1000)).toBe(false);
  });
});

describe("login-style lockout (isLockedOut / recordFailedAttempt / clearFailedAttempts)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is not locked out before reaching the failure threshold", () => {
    const bucket = `test-${Math.random()}`;
    const email = "farmer@example.com";
    expect(isLockedOut(bucket, email)).toBe(false);
    recordFailedAttempt(bucket, email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    recordFailedAttempt(bucket, email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    // Only 2 of 5 allowed failures so far — must not report locked out.
    expect(isLockedOut(bucket, email)).toBe(false);
  });

  it("locks out after reaching the failure threshold", () => {
    const bucket = `test-${Math.random()}`;
    const email = "farmer@example.com";
    let lockedNow = false;
    for (let i = 0; i < 5; i++) {
      lockedNow = recordFailedAttempt(bucket, email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    }
    expect(lockedNow).toBe(true);
    expect(isLockedOut(bucket, email)).toBe(true);
  });

  it("a successful login clears prior failures", () => {
    const bucket = `test-${Math.random()}`;
    const email = "farmer@example.com";
    recordFailedAttempt(bucket, email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    recordFailedAttempt(bucket, email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    clearFailedAttempts(bucket, email);
    expect(isLockedOut(bucket, email)).toBe(false);
    // Confirms the counter really reset, not just the lock flag: it takes a
    // fresh 5 failures again before locking out.
    let lockedNow = false;
    for (let i = 0; i < 4; i++) {
      lockedNow = recordFailedAttempt(bucket, email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    }
    expect(lockedNow).toBe(false);
  });

  it("unlocks after the lockout window passes", () => {
    const bucket = `test-${Math.random()}`;
    const email = "farmer@example.com";
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(bucket, email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    }
    expect(isLockedOut(bucket, email)).toBe(true);
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(isLockedOut(bucket, email)).toBe(false);
  });

  it("tracks different emails independently", () => {
    const bucket = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(bucket, "a@example.com", 5, 15 * 60 * 1000, 15 * 60 * 1000);
    }
    expect(isLockedOut(bucket, "a@example.com")).toBe(true);
    expect(isLockedOut(bucket, "b@example.com")).toBe(false);
  });
});
