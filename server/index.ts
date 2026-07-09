import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { CattleRecord, Camp, CommerceEventName, CountLog, VaccineRecord } from "./types";
import {
  clearAnalyticsEvents,
  createAnalyticsEvent,
  createCamp,
  createCattle,
  createCountLog,
  createCustomerSignup,
  createMarketplaceItem,
  createMarketplaceOrder,
  createMarketplaceRegistration,
  createVaccineRecord,
  deleteCamp,
  deleteCattle,
  deleteCountLog,
  deleteMarketplaceItem,
  deleteMarketplaceRegistration,
  deleteVaccineRecord,
  getAllCamps,
  getAllCattle,
  getAllAnalyticsEvents,
  getAllCountLogs,
  getAllCustomerSignups,
  getAllMarketplaceItems,
  getAllMarketplaceOrders,
  getAllMarketplaceRegistrations,
  getAllVaccineRecords,
  getCattleById,
  getDatabaseSnapshot,
  getSummary,
  importDatabaseSnapshot,
  updateCamp,
  updateCattle,
  updateMarketplaceOrderStatus,
  updateMarketplaceItem,
  updateMarketplaceRegistrationStatus,
  updateVaccineRecord,
} from "./db";

const analyticsEventNames = new Set<CommerceEventName>([
  "product_view",
  "add_to_cart",
  "checkout_click",
  "place_order_attempt",
  "place_order_success",
]);

const app = express();
const port = Number(process.env.PORT) || 4174;
const disableStaticHosting = process.env.DISABLE_STATIC === "true";
const staticDir = process.env.STATIC_DIR
  ? path.resolve(process.cwd(), process.env.STATIC_DIR)
  : path.resolve(process.cwd(), "dist");

const analyticsRateWindowMs = 60_000;
const analyticsRateLimit = 120;
const analyticsRequestLog = new Map<string, number[]>();
const bootedAt = Date.now();
const adminApiKey = process.env.ADMIN_API_KEY?.trim() || "";

function getRequestIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isAdminAuthorized(req: express.Request) {
  if (!adminApiKey) {
    return false;
  }

  const suppliedKey = req.header("x-herdflow-admin-key") || req.header("x-admin-key") || "";
  return suppliedKey === adminApiKey;
}

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get("/api/cattle", (_req, res) => {
  res.json(getAllCattle());
});

app.get("/api/cattle/:id", (req, res) => {
  const record = getCattleById(Number(req.params.id));
  if (!record) {
    return res.status(404).json({ error: "Cattle record not found" });
  }
  res.json(record);
});

app.post("/api/cattle", (req, res) => {
  const payload = req.body as Omit<CattleRecord, "id" | "createdAt">;
  if (!payload.tag || !payload.breed) {
    return res.status(400).json({ error: "Tag and breed are required." });
  }
  if (payload.status === "Dead" && !payload.deadReason?.trim()) {
    return res.status(400).json({ error: "Dead reason is required when status is Dead." });
  }

  const created = createCattle(payload);
  res.status(201).json(created);
});

app.put("/api/cattle/:id", (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as Omit<CattleRecord, "id" | "createdAt">;
  const existing = getCattleById(id);
  if (!existing) {
    return res.status(404).json({ error: "Cattle record not found" });
  }
  if (payload.status === "Dead" && !payload.deadReason?.trim()) {
    return res.status(400).json({ error: "Dead reason is required when status is Dead." });
  }

  const updated = updateCattle(id, payload);
  res.json(updated);
});

app.delete("/api/cattle/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = getCattleById(id);
  if (!existing) {
    return res.status(404).json({ error: "Cattle record not found" });
  }

  deleteCattle(id);
  res.status(204).send();
});

app.get("/api/camps", (_req, res) => {
  res.json(getAllCamps());
});

app.post("/api/camps", (req, res) => {
  const payload = req.body as Omit<Camp, "id" | "createdAt">;
  if (!payload.name || !payload.colorId) {
    return res.status(400).json({ error: "Camp name and color are required." });
  }

  const created = createCamp(payload);
  res.status(201).json(created);
});

app.put("/api/camps/:id", (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as Omit<Camp, "id" | "createdAt">;
  const updated = updateCamp(id, payload);
  res.json(updated);
});

app.delete("/api/camps/:id", (req, res) => {
  deleteCamp(Number(req.params.id));
  res.status(204).send();
});

app.get("/api/vaccines", (_req, res) => {
  res.json(getAllVaccineRecords());
});

app.post("/api/vaccines", (req, res) => {
  const payload = req.body as Omit<VaccineRecord, "id" | "createdAt">;
  const treatmentName = payload.medicineName || payload.vaccineName;
  const dueDate = payload.nextDueAt || payload.scheduledDate;
  const hasTarget =
    payload.campId !== undefined && payload.campId !== null
      ? true
      : payload.cattleId !== undefined && payload.cattleId !== null;
  if (!hasTarget || !treatmentName || !dueDate) {
    return res
      .status(400)
      .json({ error: "Camp or cattle, medicine name, and due date are required." });
  }

  const created = createVaccineRecord(payload);
  res.status(201).json(created);
});

app.put("/api/vaccines/:id", (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as Omit<VaccineRecord, "id" | "createdAt">;
  const updated = updateVaccineRecord(id, payload);
  res.json(updated);
});

app.delete("/api/vaccines/:id", (req, res) => {
  deleteVaccineRecord(Number(req.params.id));
  res.status(204).send();
});

app.get("/api/counts", (_req, res) => {
  res.json(getAllCountLogs());
});

app.get("/api/marketplace/items", (_req, res) => {
  const publishedItems = getAllMarketplaceItems().filter((item) => item.isPublished);
  res.json(publishedItems);
});

app.get("/api/admin/marketplace/items", (req, res) => {
  if (!isAdminAuthorized(req)) {
    return res
      .status(401)
      .json({ error: "Admin authorization required for draft catalog access." });
  }

  res.json(getAllMarketplaceItems());
});

app.post("/api/marketplace/items", (req, res) => {
  const payload = req.body as {
    name?: string;
    price?: string;
    unit?: string;
    description?: string;
    imageUrl?: string;
    stock?: number;
    isPublished?: boolean;
  };
  if (!payload.name || !payload.price || !payload.unit || !payload.description) {
    return res.status(400).json({ error: "Name, price, unit, and description are required." });
  }

  const isPublished = typeof payload.isPublished === "boolean" ? payload.isPublished : false;

  const created = createMarketplaceItem({
    name: payload.name,
    price: payload.price,
    unit: payload.unit,
    description: payload.description,
    imageUrl: payload.imageUrl?.trim() || "",
    stock: Number.isFinite(Number(payload.stock)) ? Math.max(0, Number(payload.stock)) : 0,
    isPublished,
    publishedAt: isPublished ? new Date().toISOString() : null,
  });
  res.status(201).json(created);
});

app.put("/api/marketplace/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as {
    name?: string;
    price?: string;
    unit?: string;
    description?: string;
    imageUrl?: string;
    stock?: number;
    isPublished?: boolean;
  };
  if (!payload.name || !payload.price || !payload.unit || !payload.description) {
    return res.status(400).json({ error: "Name, price, unit, and description are required." });
  }

  const isPublished = typeof payload.isPublished === "boolean" ? payload.isPublished : false;

  try {
    const updated = updateMarketplaceItem(id, {
      name: payload.name,
      price: payload.price,
      unit: payload.unit,
      description: payload.description,
      imageUrl: payload.imageUrl?.trim() || "",
      stock: Number.isFinite(Number(payload.stock)) ? Math.max(0, Number(payload.stock)) : 0,
      isPublished,
      publishedAt: isPublished ? new Date().toISOString() : null,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Marketplace item not found" });
  }
});

app.delete("/api/marketplace/items/:id", (req, res) => {
  deleteMarketplaceItem(Number(req.params.id));
  res.status(204).send();
});

app.get("/api/marketplace/registrations", (_req, res) => {
  res.json(getAllMarketplaceRegistrations());
});

app.get("/api/customer-signups", (_req, res) => {
  res.json(getAllCustomerSignups());
});

app.get("/api/orders", (_req, res) => {
  res.json(getAllMarketplaceOrders());
});

app.get("/api/analytics/events", (_req, res) => {
  res.json(getAllAnalyticsEvents());
});

app.delete("/api/analytics/events", (_req, res) => {
  clearAnalyticsEvents();
  return res.status(204).send();
});

app.post("/api/analytics/events", (req, res) => {
  const requestIp = getRequestIp(req);
  const now = Date.now();
  const recent = (analyticsRequestLog.get(requestIp) || []).filter(
    (stamp) => now - stamp < analyticsRateWindowMs,
  );
  if (recent.length >= analyticsRateLimit) {
    return res
      .status(429)
      .json({ error: "Too many analytics events from this source. Please retry shortly." });
  }
  recent.push(now);
  analyticsRequestLog.set(requestIp, recent);

  const payload = req.body as {
    event?: CommerceEventName;
    at?: string;
    path?: string;
    session?: string;
    experiment?: string;
    variant?: string;
    itemId?: number;
    itemName?: string;
    category?: string;
    unitPrice?: number;
    currency?: string;
    listPosition?: number;
    source?: string;
    cartItems?: number;
    cartValue?: number;
    lineCount?: number;
    orderNumber?: string;
    totalAmount?: string;
    paymentMethod?: string;
    paymentStatus?: string;
  };

  const event = payload.event;
  if (!event || !analyticsEventNames.has(event)) {
    return res.status(400).json({ error: "Valid event is required." });
  }

  if (!payload.path || !payload.session || !payload.experiment || !payload.variant) {
    return res.status(400).json({ error: "Path, session, experiment, and variant are required." });
  }

  let parsedAt = new Date().toISOString();
  if (payload.at) {
    const candidate = new Date(payload.at);
    if (Number.isNaN(candidate.getTime())) {
      return res.status(400).json({ error: "Invalid event timestamp." });
    }
    parsedAt = candidate.toISOString();
  }

  const created = createAnalyticsEvent({
    event,
    at: parsedAt,
    path: String(payload.path),
    session: String(payload.session),
    experiment: String(payload.experiment),
    variant: String(payload.variant),
    itemId: Number.isFinite(Number(payload.itemId)) ? Number(payload.itemId) : undefined,
    itemName: payload.itemName ? String(payload.itemName) : undefined,
    category: payload.category ? String(payload.category) : undefined,
    unitPrice: Number.isFinite(Number(payload.unitPrice)) ? Number(payload.unitPrice) : undefined,
    currency: payload.currency ? String(payload.currency) : undefined,
    listPosition: Number.isFinite(Number(payload.listPosition))
      ? Number(payload.listPosition)
      : undefined,
    source: payload.source ? String(payload.source) : undefined,
    cartItems: Number.isFinite(Number(payload.cartItems)) ? Number(payload.cartItems) : undefined,
    cartValue: Number.isFinite(Number(payload.cartValue)) ? Number(payload.cartValue) : undefined,
    lineCount: Number.isFinite(Number(payload.lineCount)) ? Number(payload.lineCount) : undefined,
    orderNumber: payload.orderNumber ? String(payload.orderNumber) : undefined,
    totalAmount: payload.totalAmount ? String(payload.totalAmount) : undefined,
    paymentMethod: payload.paymentMethod ? String(payload.paymentMethod) : undefined,
    paymentStatus: payload.paymentStatus ? String(payload.paymentStatus) : undefined,
  });

  return res.status(201).json(created);
});

app.post("/api/orders", (req, res) => {
  const payload = req.body as {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    notes?: string;
    paymentMethod?: "PayOnDelivery" | "Stripe" | "PayFast";
    lines?: Array<{
      itemId?: number;
      name?: string;
      price?: string;
      unit?: string;
      quantity?: number;
      imageUrl?: string;
    }>;
    totalAmount?: string;
  };

  if (
    !payload.customerName ||
    !payload.customerEmail ||
    !payload.customerPhone ||
    !payload.deliveryAddress
  ) {
    return res
      .status(400)
      .json({ error: "Customer name, email, phone, and delivery address are required." });
  }

  if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
    return res.status(400).json({ error: "At least one order line is required." });
  }

  const cleanLines = payload.lines
    .filter(
      (line) =>
        line.itemId && line.name && line.price && line.unit && line.quantity && line.quantity > 0,
    )
    .map((line) => ({
      itemId: Number(line.itemId),
      name: String(line.name),
      price: String(line.price),
      unit: String(line.unit),
      quantity: Number(line.quantity),
      imageUrl: line.imageUrl ? String(line.imageUrl) : "",
    }));

  if (cleanLines.length === 0) {
    return res.status(400).json({ error: "Order lines are invalid." });
  }

  const marketplaceItems = getAllMarketplaceItems();
  for (const line of cleanLines) {
    const sourceItem = marketplaceItems.find((item) => item.id === line.itemId);
    const stock =
      sourceItem && Number.isFinite(Number(sourceItem.stock)) ? Number(sourceItem.stock) : 0;
    if (!sourceItem || stock < line.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${line.name}.` });
    }
  }

  const created = createMarketplaceOrder({
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    deliveryAddress: payload.deliveryAddress,
    notes: payload.notes || "",
    paymentMethod: payload.paymentMethod || "PayOnDelivery",
    paymentStatus:
      payload.paymentMethod && payload.paymentMethod !== "PayOnDelivery" ? "Initiated" : "Pending",
    paymentReference: "",
    lines: cleanLines,
    totalAmount: payload.totalAmount || "",
  });

  res.status(201).json(created);
});

app.get("/api/orders/track", (req, res) => {
  const orderNumber = String(req.query.orderNumber || "").trim();
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();
  if (!orderNumber || !email) {
    return res.status(400).json({ error: "Order number and email are required." });
  }

  const found = getAllMarketplaceOrders().find(
    (entry) =>
      entry.orderNumber.toLowerCase() === orderNumber.toLowerCase() &&
      entry.customerEmail.toLowerCase() === email,
  );

  if (!found) {
    return res.status(404).json({ error: "Order not found." });
  }

  return res.json(found);
});

app.post("/api/payments/checkout", (req, res) => {
  const payload = req.body as { orderId?: number; method?: "Stripe" | "PayFast" | "PayOnDelivery" };
  if (!payload.orderId || !payload.method) {
    return res.status(400).json({ error: "Order ID and payment method are required." });
  }

  if (payload.method === "PayOnDelivery") {
    return res.json({ checkoutUrl: "", message: "No online checkout required." });
  }

  const order = getAllMarketplaceOrders().find((entry) => entry.id === Number(payload.orderId));
  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  const stripeBase = process.env.STRIPE_CHECKOUT_URL || "";
  const payfastBase = process.env.PAYFAST_CHECKOUT_URL || "";
  const fallbackBase = payload.method === "Stripe" ? stripeBase : payfastBase;
  const checkoutUrl = fallbackBase
    ? `${fallbackBase}${fallbackBase.includes("?") ? "&" : "?"}order=${encodeURIComponent(order.orderNumber)}`
    : `${req.protocol}://${req.get("host")}/track?order=${encodeURIComponent(order.orderNumber)}&payment=${payload.method.toLowerCase()}`;

  return res.json({ checkoutUrl, message: `${payload.method} checkout initialized.` });
});

app.put("/api/orders/:id/status", (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as { status?: "Pending" | "Confirmed" | "Fulfilled" | "Cancelled" };
  if (!payload.status) {
    return res.status(400).json({ error: "Status is required." });
  }

  try {
    const updated = updateMarketplaceOrderStatus(id, payload.status);
    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Marketplace order not found" });
  }
});

app.post("/api/customer-signups", (req, res) => {
  const payload = req.body as { name?: string; email?: string; phone?: string; interest?: string };
  if (!payload.name || !payload.email || !payload.interest) {
    return res.status(400).json({ error: "Name, email, and interest are required." });
  }

  const created = createCustomerSignup({
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "",
    interest: payload.interest,
  });
  res.status(201).json(created);
});

app.post("/api/marketplace/registrations", (req, res) => {
  const payload = req.body as {
    certificationType?: "Logistics Certified Client" | "Certified Livestock Seller";
    name?: string;
    companyName?: string;
    phone?: string;
    email?: string;
    region?: string;
    note?: string;
  };

  if (
    !payload.certificationType ||
    !payload.name ||
    !payload.companyName ||
    !payload.phone ||
    !payload.email ||
    !payload.region
  ) {
    return res.status(400).json({
      error: "Certification type, name, company name, phone, email, and region are required.",
    });
  }

  const created = createMarketplaceRegistration({
    certificationType: payload.certificationType,
    status: "Pending",
    name: payload.name,
    companyName: payload.companyName,
    phone: payload.phone,
    email: payload.email,
    region: payload.region,
    note: payload.note || "",
  });
  res.status(201).json(created);
});

app.put("/api/marketplace/registrations/:id/status", (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body as { status?: "Pending" | "Approved" | "Rejected" };
  if (!payload.status) {
    return res.status(400).json({ error: "Status is required." });
  }

  try {
    const updated = updateMarketplaceRegistrationStatus(id, payload.status);
    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Marketplace registration not found" });
  }
});

app.delete("/api/marketplace/registrations/:id", (req, res) => {
  deleteMarketplaceRegistration(Number(req.params.id));
  res.status(204).send();
});

app.post("/api/counts", (req, res) => {
  const payload = req.body as Omit<CountLog, "id" | "createdAt">;
  if (!payload.campId || !payload.countDate) {
    return res.status(400).json({ error: "Camp and count date are required." });
  }

  const created = createCountLog(payload);
  res.status(201).json(created);
});

app.delete("/api/counts/:id", (req, res) => {
  deleteCountLog(Number(req.params.id));
  res.status(204).send();
});

app.get("/api/summary", (_req, res) => {
  res.json(getSummary());
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    now: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - bootedAt) / 1000),
    version: "1.0.0",
    analyticsEvents: getAllAnalyticsEvents().length,
    orders: getAllMarketplaceOrders().length,
  });
});

app.get("/api/backup/export", (_req, res) => {
  const backup = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    data: getDatabaseSnapshot(),
  };
  const fileStamp = backup.exportedAt.replace(/[:.]/g, "-");
  res.setHeader("Content-Disposition", `attachment; filename="herdflow-backup-${fileStamp}.json"`);
  res.json(backup);
});

app.post("/api/backup/import", (req, res) => {
  try {
    importDatabaseSnapshot(req.body);
    res.json({ status: "ok", summary: getSummary() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invalid backup payload." });
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

if (!disableStaticHosting && fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`HerdFlow API server started on http://localhost:${port}`);
  if (!disableStaticHosting && fs.existsSync(staticDir)) {
    console.log(`Serving static files from ${staticDir}`);
  }
});
