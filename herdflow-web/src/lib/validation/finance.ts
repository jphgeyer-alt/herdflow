import { z } from "zod";

// amountCents is always a positive integer — never a float, never zero/negative.
export const centsAmount = z.number().int().positive();

// Loose ISO date/datetime string that parses to a real Date — Date.parse is
// permissive, so this also rejects the empty-string/whitespace case it lets
// through.
export const isoDateString = z.string().trim().min(1).refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "must be a valid date",
});

export const expenseCategory = z.string().trim().min(1).max(120);
export const expenseDescription = z.string().trim().min(1).max(500);
export const expenseNotes = z.string().trim().max(2000).optional();
export const expenseInvoiceNumber = z.string().trim().max(120).optional();
export const recurrenceInterval = z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]);
export const expenseCategoryName = z.string().trim().min(1).max(120);

export const expenseCreateSchema = z
  .object({
    category: expenseCategory,
    description: expenseDescription,
    amountCents: centsAmount,
    date: isoDateString,
    notes: expenseNotes,
    invoiceNumber: expenseInvoiceNumber,
    isRecurring: z.boolean().optional(),
    recurrenceInterval: recurrenceInterval.optional(),
  })
  .refine((data) => !data.isRecurring || data.recurrenceInterval !== undefined, {
    message: "recurrenceInterval is required when isRecurring is true",
    path: ["recurrenceInterval"],
  });

// PATCH allows partial updates — every field optional, but whatever is
// present must still pass the same rules as create.
export const expenseUpdateSchema = z
  .object({
    category: expenseCategory.optional(),
    description: expenseDescription.optional(),
    amountCents: centsAmount.optional(),
    date: isoDateString.optional(),
    notes: expenseNotes,
    invoiceNumber: expenseInvoiceNumber,
    isRecurring: z.boolean().optional(),
    recurrenceInterval: recurrenceInterval.optional(),
  })
  .refine((data) => !data.isRecurring || data.recurrenceInterval !== undefined, {
    message: "recurrenceInterval is required when isRecurring is true",
    path: ["recurrenceInterval"],
  });

export const expenseCategoryCreateSchema = z.object({
  name: expenseCategoryName,
});
