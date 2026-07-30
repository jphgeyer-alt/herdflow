import { Skeleton, SkeletonStatRow, SkeletonTable } from "@/components/farm/Skeleton";

export default function PurchasesLoading() {
  return (
    <div className="space-y-6 pb-10">
      <Skeleton className="h-7 w-40" />
      <SkeletonStatRow count={4} />
      <Skeleton className="h-9 w-48 rounded-lg" />
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
