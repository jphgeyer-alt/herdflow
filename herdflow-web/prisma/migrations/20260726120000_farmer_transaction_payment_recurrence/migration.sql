-- CreateEnum
CREATE TYPE "FarmerTransactionPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "FarmerTransactionRecurrence" AS ENUM ('WEEKLY', 'MONTHLY', 'ANNUALLY');

-- AlterTable
-- Purely additive: paymentMethod/recurrence are nullable with no default, so
-- every existing row reads as "not recorded" rather than a guessed value.
-- isRecurring defaults to false, matching every existing row's real state.
-- No RLS changes -- FarmerTransaction already has RLS enabled/forced from
-- earlier migrations (20260710020000, 20260710030000), and this migration
-- doesn't touch policies.
ALTER TABLE "FarmerTransaction" ADD COLUMN     "paymentMethod" "FarmerTransactionPaymentMethod",
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrence" "FarmerTransactionRecurrence";
