-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "invoiceNumber" TEXT;

-- CreateTable
-- Admin-managed lookup list for Expense.category. No RLS — global catalog
-- data, admin-only write enforced at the application layer (SUPER_ADMIN
-- check in the API route), same convention as SubscriptionPlan/PlatformFee.
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- Seed an expanded starter list. The first three match the categories
-- already in use on existing Expense rows (confirmed via a live query
-- before writing this migration) so the picker never "loses" a
-- currently-used category; the rest are new options requested alongside
-- this feature.
INSERT INTO "ExpenseCategory" ("id", "name", "createdBy") VALUES
  ('expcat_hosting_infrastructure', 'Hosting & Infrastructure', 'system:seed'),
  ('expcat_software_tools', 'Software & Tools', 'system:seed'),
  ('expcat_other', 'Other', 'system:seed'),
  ('expcat_salaries', 'Salaries', 'system:seed'),
  ('expcat_marketing_ads', 'Marketing & Ads', 'system:seed'),
  ('expcat_legal_compliance', 'Legal & Compliance', 'system:seed'),
  ('expcat_office_admin', 'Office & Admin', 'system:seed'),
  ('expcat_payment_processing_fees', 'Payment Processing Fees', 'system:seed'),
  ('expcat_bank_charges', 'Bank Charges', 'system:seed'),
  ('expcat_insurance', 'Insurance', 'system:seed'),
  ('expcat_travel_transport', 'Travel & Transport', 'system:seed'),
  ('expcat_equipment', 'Equipment', 'system:seed'),
  ('expcat_professional_services', 'Professional Services', 'system:seed'),
  ('expcat_training_development', 'Training & Development', 'system:seed'),
  ('expcat_contractors_freelancers', 'Contractors & Freelancers', 'system:seed'),
  ('expcat_refunds_chargebacks', 'Refunds & Chargebacks', 'system:seed'),
  ('expcat_domain_ssl', 'Domain & SSL', 'system:seed'),
  ('expcat_data_analytics', 'Data & Analytics', 'system:seed');
