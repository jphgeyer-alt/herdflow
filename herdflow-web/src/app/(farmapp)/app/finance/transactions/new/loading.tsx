import { Skeleton, SkeletonForm } from "@/components/farm/Skeleton";

export default function AddTransactionLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <Skeleton className="h-7 w-52" />
      <SkeletonForm fields={6} />
    </div>
  );
}
