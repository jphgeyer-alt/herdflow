"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Textarea } from "./Field";

type ConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  /** When set, shows a required textarea and passes its value to onConfirm. */
  reasonLabel?: string;
  reasonPlaceholder?: string;
};

/**
 * Generalizes the reason-capture removal modal that previously existed only
 * on Listing removal — this is now the one place every admin destructive
 * action (reject seller, cancel payout, delete expense, remove sponsor,
 * end auction, etc.) should go through instead of window.confirm().
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  reasonLabel,
  reasonPlaceholder,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasonRequired = Boolean(reasonLabel);

  async function handleConfirm() {
    if (reasonRequired && !reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(reasonRequired ? reason.trim() : undefined);
      setReason("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={submitting}
            disabled={reasonRequired && !reason.trim()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-navy-400">{description}</p>}
      {reasonLabel && (
        <Textarea
          className="mt-3"
          label={reasonLabel}
          placeholder={reasonPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
        />
      )}
    </Modal>
  );
}
