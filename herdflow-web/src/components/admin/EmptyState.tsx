import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <div className="rounded-full bg-navy-25 p-3 text-navy-200">
        <Icon size={22} />
      </div>
      <p className="font-semibold text-navy-500">{title}</p>
      {description && <p className="max-w-sm text-sm text-navy-300">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function TableEmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState title={message} />
      </td>
    </tr>
  );
}
