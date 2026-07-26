"use client";
// WEBSITE — herdflow-web/src/components/farm/DownloadPdfButton.tsx
// F9: every report's "Download PDF" was a plain <a href> with no loading
// state and no visible error if the PDF route failed -- fetches the PDF
// itself instead, so a slow render shows a spinner and a failure shows an
// inline message rather than a bare browser navigation to an error page.
import { useState } from "react";
import { Download, AlertCircle, Loader2 } from "lucide-react";

export function DownloadPdfButton({ href, filename }: { href: string; filename: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Generating…
          </>
        ) : (
          <>
            <Download size={16} /> Download PDF
          </>
        )}
      </button>
      {error && (
        <p className="flex items-center gap-1 text-xs text-[var(--status-danger-text)]">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
