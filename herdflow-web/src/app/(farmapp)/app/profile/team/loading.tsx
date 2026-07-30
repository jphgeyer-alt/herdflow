import { Skeleton, SkeletonCard } from "@/components/farm/Skeleton";

export default function TeamLoading() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </div>
  );
}
