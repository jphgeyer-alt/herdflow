// WEBSITE — herdflow-web/src/app/invoice/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentView } from "@/components/marketing/DocumentView";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { sponsor: true },
  });

  if (!invoice) notFound();

  const notes = invoice.paymentReference
    ? `${invoice.notes ? invoice.notes + " — " : ""}Payment ref: ${invoice.paymentReference}`
    : invoice.notes;

  return (
    <DocumentView
      kind="invoice"
      number={invoice.number}
      status={invoice.status}
      issueDate={invoice.issueDate}
      validUntilOrDueDate={invoice.dueDate}
      sponsor={invoice.sponsor}
      description={invoice.description}
      amount={invoice.amount.toString()}
      notes={notes}
    />
  );
}
