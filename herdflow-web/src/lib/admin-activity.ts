import { prisma } from "@/lib/prisma";
import type { AdminIdentity } from "@/lib/admin-auth";

/**
 * Records an admin action to the audit trail. Fire-and-forget — logging
 * failures should never block the action itself.
 */
export function logAdminActivity(
  admin: AdminIdentity | null,
  action: string,
  entityType: string,
  options?: { entityId?: string; entityLabel?: string; metadata?: Record<string, unknown> },
): void {
  prisma.adminActivityLog
    .create({
      data: {
        adminUserId: admin?.id ?? null,
        adminName: admin?.fullName ?? "Unknown",
        action,
        entityType,
        entityId: options?.entityId,
        entityLabel: options?.entityLabel,
        metadata: options?.metadata ? JSON.stringify(options.metadata) : undefined,
      },
    })
    .catch((err) => console.error("logAdminActivity failed:", err));
}
