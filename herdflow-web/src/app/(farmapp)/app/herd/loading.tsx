import { Skeleton, SkeletonStatRow, SkeletonTable } from "@/components/farm/Skeleton";

export default function HerdLoading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <SkeletonStatRow count={2} />
      <Skeleton className="h-12 w-full rounded-lg" />
      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}
