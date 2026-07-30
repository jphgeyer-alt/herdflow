import { Skeleton, SkeletonCard } from "@/components/farm/Skeleton";

export default function ActivityLoading() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <Skeleton className="mb-2 h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <SkeletonCard lines={8} />
    </div>
  );
}
