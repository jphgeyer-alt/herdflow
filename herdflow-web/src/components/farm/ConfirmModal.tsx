"use client";
// herdflow-web/src/components/farm/ConfirmModal.tsx
// Styled replacement for native browser confirm() before destructive
// actions -- purely presentational (no form/server-action awareness), so
// the caller decides what "confirm" actually does (submit a form, call an
// action, etc.) via onConfirm.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = true,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/45 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="w-full max-w-sm rounded-lg border border-navy-100 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          {danger && (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]">
              <AlertTriangle size={16} />
            </div>
          )}
          <div className="min-w-0">
            <h2 id="confirm-modal-title" className="text-navy-600 text-sm font-bold">
              {title}
            </h2>
            <p id="confirm-modal-description" className="mt-1.5 text-sm text-navy-300">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-navy-100 px-4 py-2 text-sm font-semibold text-navy-600 transition hover:bg-navy-25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? "bg-[var(--status-danger-text)] hover:opacity-90"
                : "bg-navy-600 hover:bg-navy-700"
            }`}
          >
            {pending ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
