import { Skeleton } from "@/components/farm/Skeleton";

export default function CampsLoading() {
  return (
    <div className="relative h-[75vh] w-full overflow-hidden rounded-lg">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute left-4 top-4 w-72 space-y-2 rounded-lg border border-navy-50 bg-white p-4 shadow-sm">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
