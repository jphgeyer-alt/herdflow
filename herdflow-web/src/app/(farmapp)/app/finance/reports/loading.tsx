import { Skeleton, SkeletonCard } from "@/components/farm/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-64 rounded-lg" />
      <SkeletonCard lines={8} />
    </div>
  );
}
