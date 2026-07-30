import { Skeleton } from "@/components/farm/Skeleton";

export default function HubLoading() {
  return (
    <div className="min-h-screen bg-navy-25 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Skeleton className="mb-3 h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-xl border border-navy-50 bg-white p-5 shadow-sm">
              <Skeleton className="mb-4 h-9 w-9 rounded-lg" />
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
