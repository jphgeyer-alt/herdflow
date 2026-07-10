// Pure styling helper — deliberately NOT in Button.tsx (which is "use
// client") so it can be imported and called from Server Components too,
// e.g. to style a server-rendered <a>/<Link> as a button (CSV export links,
// pagination controls) without needing "use client" just for that.

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-navy-600 text-white hover:bg-navy-700 shadow-sm",
  secondary: "bg-green text-white hover:bg-green-dark shadow-sm",
  outline: "border border-navy-100 text-navy-600 hover:bg-navy-25 bg-white",
  ghost: "text-navy-400 hover:bg-navy-25 hover:text-navy-600",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`;
}
