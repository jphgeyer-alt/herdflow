// WEBSITE — herdflow-web/src/app/quote/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentView } from "@/components/marketing/DocumentView";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { sponsor: true },
  });

  if (!quote) notFound();

  return (
    <DocumentView
      kind="quote"
      number={quote.number}
      status={quote.status}
      issueDate={quote.createdAt}
      validUntilOrDueDate={quote.validUntil}
      sponsor={quote.sponsor}
      description={quote.description}
      amount={quote.amount.toString()}
      notes={quote.notes}
    />
  );
}
