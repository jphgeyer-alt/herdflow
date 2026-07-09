-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'PICKUP',
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingProvince" TEXT;

-- CreateTable
CREATE TABLE "DeliveryRequest" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "orderId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "pickupRegion" TEXT NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffRegion" TEXT NOT NULL,
    "cargoDescription" TEXT NOT NULL,
    "neededBy" TIMESTAMP(3),
    "priceCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL DEFAULT 0,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'OPEN',
    "logisticsPartnerId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "payoutId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsPayout" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "logisticsPartnerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRequest_number_key" ON "DeliveryRequest"("number");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRequest_orderId_key" ON "DeliveryRequest"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryRequest_status_pickupRegion_idx" ON "DeliveryRequest"("status", "pickupRegion");

-- CreateIndex
CREATE INDEX "DeliveryRequest_payoutId_idx" ON "DeliveryRequest"("payoutId");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsPayout_number_key" ON "LogisticsPayout"("number");

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "LogisticsPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "LogisticsPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsPayout" ADD CONSTRAINT "LogisticsPayout_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "LogisticsPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

