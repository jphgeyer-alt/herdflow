import { Skeleton, SkeletonStatRow, SkeletonCard } from "@/components/farm/Skeleton";

export default function FinanceDashboardLoading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-56 rounded-lg" />
      </div>
      <SkeletonStatRow count={6} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SkeletonCard lines={5} />
        </div>
        <SkeletonCard lines={3} />
      </div>
      <SkeletonCard lines={4} />
    </div>
  );
}
