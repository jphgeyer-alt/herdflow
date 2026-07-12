// Cron-callable, same shape as releaseFunds() in src/lib/payments/payouts.ts.
// A recurring Expense is a "template" row (isRecurring=true,
// recurrenceInterval + nextOccurrenceAt set); each due occurrence spawns a
// real one-time Expense row (isRecurring=false, parentExpenseId pointing
// back at the template) and advances the template's nextOccurrenceAt past
// "now" — which is what makes this idempotent: running twice in the same
// window finds nothing left due the second time.
import { withAdminContext } from "@/lib/tenant-prisma";
import type { RecurrenceInterval } from "@prisma/client";

const RECURRING_SYSTEM_USER = "system:recurring-expense";

// Bounds how many missed occurrences a single run will catch up per
// template, so a long-stale template can't generate an unbounded batch in
// one cron run — the daily cron just keeps closing the gap over subsequent
// runs instead.
const MAX_CATCHUP_PER_RUN = 24;

// Exported for the expense create/update routes, which need to compute a
// template's initial/updated nextOccurrenceAt the same way this module
// advances it — one interval past the given date.
export function advance(date: Date, interval: RecurrenceInterval): Date {
  const next = new Date(date);
  if (interval === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else if (interval === "QUARTERLY") next.setMonth(next.getMonth() + 3);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

export async function generateDueRecurringExpenses(): Promise<{ generated: number }> {
  const now = new Date();
  let generated = 0;

  await withAdminContext(async (tx) => {
    const templates = await tx.expense.findMany({
      where: { isRecurring: true, nextOccurrenceAt: { lte: now } },
    });

    for (const template of templates) {
      if (!template.recurrenceInterval || !template.nextOccurrenceAt) continue;

      let due = template.nextOccurrenceAt;
      let iterations = 0;
      while (due <= now && iterations < MAX_CATCHUP_PER_RUN) {
        await tx.expense.create({
          data: {
            category: template.category,
            description: template.description,
            amountCents: template.amountCents,
            date: due,
            notes: template.notes,
            createdBy: RECURRING_SYSTEM_USER,
            parentExpenseId: template.id,
          },
        });
        generated++;
        iterations++;
        due = advance(due, template.recurrenceInterval);
      }

      await tx.expense.update({ where: { id: template.id }, data: { nextOccurrenceAt: due } });
    }
  });

  return { generated };
}
