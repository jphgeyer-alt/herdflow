export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
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
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Single source of truth for status -> (variant, label) across the admin
 * panel. Previously ~6 pages each independently invented their own
 * STATUS_COLORS map, so the same semantic state (e.g. "PENDING") could show
 * as yellow in one place and amber in another.
 */
const STATUS_MAP: Record<string, { variant: BadgeVariant; label?: string }> = {
  // Verification (Seller / LogisticsPartner)
  PENDING: { variant: "warning" },
  APPROVED: { variant: "success" },
  REJECTED: { variant: "danger" },
  SUSPENDED: { variant: "danger" },

  // Listing / Product
  ACTIVE: { variant: "success" },
  DRAFT: { variant: "neutral" },
  ARCHIVED: { variant: "neutral" },
  SOLD: { variant: "info" },
  OUT_OF_STOCK: { variant: "warning" },
  PASSED: { variant: "neutral" },

  // AuctionSession
  UPCOMING: { variant: "info" },
  LIVE: { variant: "success" },
  CLOSED: { variant: "neutral" },

  // Order
  PAID: { variant: "success" },
  PROCESSING: { variant: "info" },
  SHIPPED: { variant: "info" },
  COMPLETED: { variant: "success" },
  CANCELLED: { variant: "danger" },
  FAILED: { variant: "danger" },

  // DeliveryRequest
  OPEN: { variant: "info" },
  ASSIGNED: { variant: "warning" },
  IN_TRANSIT: { variant: "info" },
  DELIVERED: { variant: "success" },

  // Payout
  PAID_OUT: { variant: "success", label: "Paid" },

  // Invoice
  UNPAID: { variant: "warning" },
  OVERDUE: { variant: "danger" },

  // Quote
  SENT: { variant: "info" },
  ACCEPTED: { variant: "success" },
  DECLINED: { variant: "danger" },
  EXPIRED: { variant: "neutral" },

  // Generic
  YES: { variant: "success" },
  NO: { variant: "neutral" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const entry = STATUS_MAP[status] ?? { variant: "neutral" as BadgeVariant };
  return <Badge variant={entry.variant}>{label ?? entry.label ?? status}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const variant: BadgeVariant = role === "SUPER_ADMIN" ? "info" : role === "ADMIN" ? "neutral" : "neutral";
  return <Badge variant={variant}>{role.replace(/_/g, " ")}</Badge>;
}
