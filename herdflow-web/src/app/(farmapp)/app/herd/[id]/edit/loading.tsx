import { Skeleton, SkeletonForm } from "@/components/farm/Skeleton";

export default function EditAnimalLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <Skeleton className="h-7 w-36" />
      <SkeletonForm fields={8} />
    </div>
  );
}
