"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { BookTransportForm } from "./book-transport-form";

export function RequestTransportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B3A6B] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
      >
        <Send size={16} />
        Request Transport
      </button>
      {open && <BookTransportForm onClose={() => setOpen(false)} />}
    </>
  );
}
