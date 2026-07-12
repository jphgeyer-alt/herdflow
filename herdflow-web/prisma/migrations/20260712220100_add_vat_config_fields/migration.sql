-- AlterTable
-- VAT tracking, off by default (vatRateBps null) until the vat_enabled
-- SiteConfig key is turned on — see getVatConfig() in
-- src/lib/marketplace/commission.ts. Historical/untracked rows keep
-- vatRateBps null, which report code treats as "not tracked" rather than
-- "0% VAT", so nothing retroactively changes when the toggle flips on.
ALTER TABLE "Payment" ADD COLUMN     "vatRateBps" INTEGER,
ADD COLUMN     "vatInclusive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "vatRateBps" INTEGER,
ADD COLUMN     "vatInclusive" BOOLEAN NOT NULL DEFAULT true;
