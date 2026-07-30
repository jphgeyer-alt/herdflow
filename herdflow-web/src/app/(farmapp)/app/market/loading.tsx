import { Skeleton, SkeletonCard } from "@/components/farm/Skeleton";

export default function MarketLoading() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} lines={4} />
        ))}
      </div>
      <SkeletonCard lines={2} />
    </div>
  );
}
