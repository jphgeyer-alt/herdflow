import { Skeleton, SkeletonForm } from "@/components/farm/Skeleton";

export default function NewAnimalLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <Skeleton className="h-7 w-40" />
      <SkeletonForm fields={12} />
    </div>
  );
}
