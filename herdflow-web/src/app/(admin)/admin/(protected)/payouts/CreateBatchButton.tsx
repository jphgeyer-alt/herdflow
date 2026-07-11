"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/admin/Button";

export function CreateBatchButton() {
  const [loading, setLoading] = useState(false);

  async function createBatch() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts/batch", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to create payout batch.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seller-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Payout batch created — CSV downloaded.");
      window.location.reload();
    } catch {
      toast.error("Failed to create payout batch.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" loading={loading} onClick={createBatch}>
      <Download size={14} className="mr-1.5 inline" />
      Create Payout Batch (CSV)
    </Button>
  );
}
