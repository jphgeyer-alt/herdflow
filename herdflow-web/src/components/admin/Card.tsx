export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-navy-50 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-navy-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-navy-600 text-lg font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-navy-300">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

type StatAccent = "navy" | "gold" | "green" | "danger";

const ACCENT_TEXT: Record<StatAccent, string> = {
  navy: "text-navy-600",
  gold: "text-brand-gold",
  green: "text-green",
  danger: "text-red-600",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "navy",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: StatAccent;
  hint?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">{label}</p>
          <p className={`mt-2 text-2xl font-semibold ${ACCENT_TEXT[accent]}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-navy-300">{hint}</p>}
        </div>
        {icon && (
          <div className="rounded-lg bg-navy-25 p-2 text-navy-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
