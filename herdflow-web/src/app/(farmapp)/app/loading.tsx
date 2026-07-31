import { Skeleton, SkeletonStatRow, SkeletonCard } from "@/components/farm/Skeleton";

export default function HubLoading() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <SkeletonStatRow count={4} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SkeletonCard lines={5} />
        </div>
        <SkeletonCard lines={4} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}
