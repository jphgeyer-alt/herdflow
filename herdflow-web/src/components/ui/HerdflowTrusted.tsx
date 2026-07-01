import { CheckCircle2 } from "lucide-react";

type HerdflowTrustedProps = {
  className?: string;
  compact?: boolean;
};

export function HerdflowTrusted({ className = "", compact = false }: HerdflowTrustedProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green/10 text-green px-2.5 py-1 font-semibold ${
        compact ? "text-[11px]" : "text-xs"
      } ${className}`.trim()}
    >
      <CheckCircle2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      HerdFlow Trusted
    </span>
  );
}
