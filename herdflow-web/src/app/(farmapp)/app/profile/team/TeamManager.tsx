"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/team/TeamManager.tsx
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Trash2, XCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/farm/Card";
import { formatDate } from "@/lib/farm-finance/format";
import {
  generateInviteCode,
  revokeInviteCode,
  removeMember,
  type TeamActionState,
} from "./actions";

const initialState: TeamActionState = {};

export interface StaffMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string | null;
}

export interface Invite {
  inviteCode: string;
  role: string;
  expiresAt: string;
}

export function TeamManager({
  isOwner,
  staff,
  invites,
}: {
  isOwner: boolean;
  staff: StaffMember[];
  invites: Invite[];
}) {
  const t = useTranslations("profile");
  const [genState, genAction, genPending] = useActionState(generateInviteCode, initialState);

  return (
    <div className="space-y-6">
      {!isOwner && (
        <div className="rounded-lg border border-navy-100 bg-navy-25 px-4 py-3 text-sm text-navy-500">
          {t("only_owner_can_manage_team")}
        </div>
      )}

      {isOwner && (
        <Card className="p-5">
          <form action={genAction} className="flex flex-wrap items-end gap-3">
            {genState.error && (
              <div className="flex w-full items-center gap-2 rounded-lg border border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
                <AlertCircle size={16} />
                {genState.error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
                {t("invite_role")}
              </label>
              <select name="role" className="rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600">
                <option value="FARM_MANAGER">{t("role_farm_manager")}</option>
                <option value="FARM_WORKER">{t("role_farm_worker")}</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={genPending}
              className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("generate_invite")}
            </button>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title={t("active_invites")} />
        {invites.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">{t("no_active_invites")}</p>
        ) : (
          <div className="divide-y divide-navy-50">
            {invites.map((inv) => (
              <div key={inv.inviteCode} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-navy-600">{inv.inviteCode}</p>
                  <p className="text-xs text-navy-300">
                    {inv.role === "FARM_MANAGER" ? t("role_farm_manager") : t("role_farm_worker")} ·{" "}
                    {t("invite_expires", { date: formatDate(inv.expiresAt) })}
                  </p>
                </div>
                {isOwner && <RevokeButton inviteCode={inv.inviteCode} />}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={t("team_title")} description={t("team_subtitle")} />
        {staff.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">{t("no_team_members")}</p>
        ) : (
          <div className="divide-y divide-navy-50">
            {staff.map((s) => (
              <div key={s.userId} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-600">{s.name || s.email}</p>
                  <p className="truncate text-xs text-navy-300">
                    {s.role}
                    {s.joinedAt ? ` · ${t("joined", { date: formatDate(s.joinedAt) })}` : ""}
                  </p>
                </div>
                {isOwner && <RemoveButton staffUserId={s.userId} />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RevokeButton({ inviteCode }: { inviteCode: string }) {
  const t = useTranslations("profile");
  const [, action, pending] = useActionState(revokeInviteCode, initialState);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(t("confirm_revoke_invite"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="inviteCode" value={inviteCode} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-semibold text-navy-500 hover:bg-navy-25 disabled:opacity-60"
      >
        <XCircle size={14} /> {t("revoke")}
      </button>
    </form>
  );
}

function RemoveButton({ staffUserId }: { staffUserId: string }) {
  const t = useTranslations("profile");
  const [, action, pending] = useActionState(removeMember, initialState);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(t("confirm_remove_member"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="staffUserId" value={staffUserId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 rounded-lg border border-[var(--status-danger-text)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] disabled:opacity-60"
      >
        <Trash2 size={14} /> {t("remove_member")}
      </button>
    </form>
  );
}
