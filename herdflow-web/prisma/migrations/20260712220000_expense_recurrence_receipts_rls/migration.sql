-- CreateEnum
CREATE TYPE "RecurrenceInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceInterval" "RecurrenceInterval",
ADD COLUMN     "nextOccurrenceAt" TIMESTAMP(3),
ADD COLUMN     "parentExpenseId" TEXT;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_parentExpenseId_fkey" FOREIGN KEY ("parentExpenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Expense has no tenant column — it's an internal admin-only record, never
-- scoped to a farmer/seller/user the way SellerPayout or Order are. So
-- unlike the tenant_isolation policies elsewhere in this app, this policy is
-- bypass-only: nobody sees or writes an Expense row unless the query went
-- through withAdminContext() (src/lib/tenant-prisma.ts). Both admin expense
-- routes (src/app/api/admin/expenses/route.ts and .../[id]/route.ts) were
-- already switched to withAdminContext in the same change that ships this
-- migration, so ENABLE + FORCE can land in one step (no separate
-- enable-then-force rollout needed, unlike the original tenant tables).
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_only ON "Expense";
CREATE POLICY admin_only ON "Expense"
  USING (current_setting('app.bypass_rls', true) = 'on')
  WITH CHECK (current_setting('app.bypass_rls', true) = 'on');
