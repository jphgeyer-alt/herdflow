import { Skeleton, SkeletonCard } from "@/components/farm/Skeleton";

export default function CashFlowLoading() {
  return (
    <div className="space-y-6 pb-10">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="h-9 w-64 rounded-lg" />
      <SkeletonCard lines={6} />
    </div>
  );
}
