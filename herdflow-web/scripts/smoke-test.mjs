// Tenant-isolation smoke test for /api/app/* routes.
//
// Proves two things end-to-end against a real (local or live) server:
//   1. A FARM_MANAGER's writes land in the farm owner's shared data pool
//      (regression test for the auth.id -> auth.effectiveFarmerId fix).
//   2. A completely unrelated farmer never sees another farm's data.
//
// All accounts/records created here are deleted in a `finally` block,
// pass or fail, via a direct Prisma connection (same DATABASE_URL as the
// app). Nothing is left behind in the database.
//
// Usage:
//   node --env-file=.env scripts/smoke-test.mjs --base=http://localhost:3000
//   node --env-file=.env scripts/smoke-test.mjs --base=https://www.herdflow.co.za
//
import { PrismaClient } from "@prisma/client";

const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "--base=http://localhost:3000").slice(7);
const stamp = Date.now();
const prisma = new PrismaClient();

const createdUserIds = [];
let pass = true;

function log(ok, msg) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${msg}`);
  if (!ok) pass = false;
}

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

async function registerFarmer(label) {
  const email = `qa-smoke-${label}-${stamp}@herdflow.test`;
  const { status, json } = await api("/api/auth/register", {
    method: "POST",
    body: {
      fullName: `QA Smoke ${label}`,
      email,
      password: "SmokeTest!2026",
      role: "farmer",
      farmName: `QA Smoke Farm ${label}`,
      province: "Gauteng",
      species: ["cattle"],
    },
  });
  if (status !== 200 || !json?.token) {
    throw new Error(`Failed to register farmer ${label}: ${status} ${JSON.stringify(json)}`);
  }
  createdUserIds.push(json.user.id);
  return { id: json.user.id, token: json.token, farmCode: json.user.farmCode };
}

async function registerManager(label, farmCode) {
  const email = `qa-smoke-${label}-${stamp}@herdflow.test`;
  const { status, json } = await api("/api/auth/register", {
    method: "POST",
    body: {
      fullName: `QA Smoke ${label}`,
      email,
      password: "SmokeTest!2026",
      role: "manager",
      farmCode,
    },
  });
  if (status !== 200 || !json?.token) {
    throw new Error(`Failed to register manager ${label}: ${status} ${JSON.stringify(json)}`);
  }
  createdUserIds.push(json.user.id);
  return { id: json.user.id, token: json.token };
}

async function main() {
  console.log(`\nSmoke-testing tenant isolation against: ${base}\n`);

  const ownerA = await registerFarmer("owner-a");
  const managerB = await registerManager("manager-b", ownerA.farmCode);
  const ownerC = await registerFarmer("owner-c");
  log(true, `Registered owner A (${ownerA.id}), manager B linked to A (${managerB.id}), unrelated owner C (${ownerC.id})`);

  const tagNumber = `QA-SMOKE-${stamp}`;
  const create = await api("/api/app/animals", {
    method: "POST",
    token: managerB.token,
    body: { species: "cattle", tag: tagNumber, name: "Smoke Test Animal" },
  });
  log(create.status === 201, `Manager B created an animal (status ${create.status})`);

  const asOwnerA = await api("/api/app/animals", { token: ownerA.token });
  const visibleToOwnerA = (asOwnerA.json ?? []).some((a) => a.tagNumber === tagNumber);
  log(visibleToOwnerA, "Owner A can see the animal manager B created (fix: effectiveFarmerId on writes)");

  const asOwnerC = await api("/api/app/animals", { token: ownerC.token });
  const leakedToOwnerC = (asOwnerC.json ?? []).some((a) => a.tagNumber === tagNumber);
  log(!leakedToOwnerC, "Unrelated owner C cannot see owner A's farm data (cross-tenant isolation)");

  const asManagerB = await api("/api/app/animals", { token: managerB.token });
  const visibleToManagerB = (asManagerB.json ?? []).some((a) => a.tagNumber === tagNumber);
  log(visibleToManagerB, "Manager B can see their own animal back in the shared farm pool");
}

async function cleanup() {
  await prisma.farmerAnimal.deleteMany({ where: { tagNumber: `QA-SMOKE-${stamp}` } });
  await prisma.farmerProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.$disconnect();
}

try {
  await main();
} catch (err) {
  pass = false;
  console.error("ERROR:", err.message);
} finally {
  await cleanup();
  console.log(pass ? "\nAll smoke tests passed. Test data cleaned up.\n" : "\nSMOKE TEST FAILURE. Test data cleaned up.\n");
  process.exit(pass ? 0 : 1);
}
