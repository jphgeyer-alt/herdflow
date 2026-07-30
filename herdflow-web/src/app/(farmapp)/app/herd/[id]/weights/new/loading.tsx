import { Skeleton, SkeletonForm } from "@/components/farm/Skeleton";

export default function AddWeightLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <Skeleton className="h-7 w-32" />
      <SkeletonForm fields={3} />
    </div>
  );
}
