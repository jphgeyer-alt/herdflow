"use client";

type Check = { label: string; test: (p: string) => boolean };

const CHECKS: Check[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "Number (0–9)", test: (p) => /[0-9]/.test(p) },
  { label: "Special character (!@#…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string): { score: number; label: string; color: string; barColor: string } {
  const passed = CHECKS.filter((c) => c.test(password)).length;
  if (passed <= 1) return { score: 1, label: "Very Weak", color: "text-red-600", barColor: "bg-red-500" };
  if (passed === 2) return { score: 2, label: "Weak", color: "text-orange-600", barColor: "bg-orange-500" };
  if (passed === 3) return { score: 3, label: "Good", color: "text-amber-600", barColor: "bg-amber-500" };
  return { score: 4, label: "Strong", color: "text-green-700", barColor: "bg-green-500" };
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, color, barColor } = getStrength(password);

  return (
    <div className="mt-2 space-y-2">
      {/* Bars */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? barColor : "bg-[#e4ebf5]"}`}
            />
          ))}
        </div>
        <span className={`text-xs font-semibold ${color} whitespace-nowrap`}>{label}</span>
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {CHECKS.map((c) => {
          const met = c.test(password);
          return (
            <li key={c.label} className="flex items-center gap-2 text-xs">
              <span className={met ? "text-green-600" : "text-[#9aabb9]"}>
                {met ? "✓" : "○"}
              </span>
              <span className={met ? "text-green-700 font-medium" : "text-[#9aabb9]"}>
                {c.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Returns true if password meets all requirements */
export function isPasswordStrong(password: string): boolean {
  return CHECKS.every((c) => c.test(password));
}
