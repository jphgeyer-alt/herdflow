import { Skeleton, SkeletonCard } from "@/components/farm/Skeleton";

export default function AnimalDetailLoading() {
  return (
    <div className="space-y-6 pb-10">
      <Skeleton className="h-4 w-28" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SkeletonCard lines={7} />
        <div className="lg:col-span-2">
          <SkeletonCard lines={4} />
        </div>
        <div className="lg:col-span-3">
          <SkeletonCard lines={4} />
        </div>
      </div>
    </div>
  );
}
