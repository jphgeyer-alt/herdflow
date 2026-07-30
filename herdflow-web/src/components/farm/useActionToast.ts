"use client";
// herdflow-web/src/components/farm/useActionToast.ts
// Standard success/error feedback for every farm-app Server Action form.
// Actions return { success, successMessage, redirectTo } instead of calling
// redirect() themselves -- redirect() inside the action would navigate away
// before the client ever sees the result, so there'd be nothing left to
// fire a toast from. Routing the redirect through client-side router.push
// here means the Toaster (mounted once in FarmShell, persists across
// navigations within a section) is still there to show it.
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface ActionToastState {
  error?: string;
  success?: boolean;
  successMessage?: string;
  redirectTo?: string;
}

export function useActionToast(state: ActionToastState) {
  const router = useRouter();
  const lastHandled = useRef<ActionToastState | null>(null);

  useEffect(() => {
    if (state === lastHandled.current) return;
    lastHandled.current = state;

    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      if (state.successMessage) toast.success(state.successMessage);
      if (state.redirectTo) router.push(state.redirectTo);
    }
  }, [state, router]);
}
