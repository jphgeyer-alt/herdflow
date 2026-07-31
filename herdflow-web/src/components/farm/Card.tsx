// herdflow-web/src/components/farm/Card.tsx
// Small shared primitives for the farm finance section. Deliberately not
// imported from components/admin/* -- same design tokens (the --status-*
// and --navy-* CSS vars in globals.css are truly global), but kept as its
// own copy so the farm-facing app has zero coupling to admin-only code.
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
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
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
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

export type StatTone = "navy" | "success" | "danger" | "warning" | "info";

const TONE_TEXT: Record<StatTone, string> = {
  navy: "text-navy-600",
  success: "text-[var(--status-success-text)]",
  danger: "text-[var(--status-danger-text)]",
  warning: "text-[var(--status-warning-text)]",
  info: "text-[var(--status-info-text)]",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "navy",
  hint,
  trend,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  hint?: ReactNode;
  /** e.g. { text: "▲ 12%", isUp: true } -- rendered green/red regardless of `tone`. */
  trend?: { text: string; isUp: boolean };
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-wide text-navy-300 uppercase">
            {label}
          </p>
          <p className={`mt-2 text-2xl font-semibold ${TONE_TEXT[tone]}`}>{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span
                className={
                  trend.isUp
                    ? "text-xs font-semibold text-[var(--status-success-text)]"
                    : "text-xs font-semibold text-[var(--status-danger-text)]"
                }
              >
                {trend.text}
              </span>
            )}
            {hint && <p className="text-xs text-navy-300">{hint}</p>}
          </div>
        </div>
        {icon && <div className="rounded-lg bg-navy-25 p-2 text-navy-600">{icon}</div>}
      </div>
    </Card>
  );
}

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
  danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]",
  info: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  neutral: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${BADGE_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
