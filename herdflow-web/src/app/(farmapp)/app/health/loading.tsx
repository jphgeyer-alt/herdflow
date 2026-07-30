import { Skeleton, SkeletonTable } from "@/components/farm/Skeleton";

export default function HealthHistoryLoading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <SkeletonTable rows={7} cols={6} />
    </div>
  );
}
