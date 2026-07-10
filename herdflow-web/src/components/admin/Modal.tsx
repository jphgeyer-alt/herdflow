"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
      <div
        className={`max-h-[85vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl ${SIZE_CLASSES[size]}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-navy-50 px-5 py-4">
          <h2 className="text-navy-600 text-base font-semibold">{title}</h2>
          <button
            aria-label="Close"
            className="rounded-lg p-1 text-navy-300 hover:bg-navy-25 hover:text-navy-600"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-navy-50 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
