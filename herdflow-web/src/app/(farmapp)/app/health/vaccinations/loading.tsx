import { Skeleton, SkeletonCard } from "@/components/farm/Skeleton";

export default function VaccinationsLoading() {
  return (
    <div className="space-y-6 pb-10">
      <Skeleton className="h-7 w-56" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    </div>
  );
}
