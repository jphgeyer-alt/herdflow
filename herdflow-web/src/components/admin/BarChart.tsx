"use client";

function formatZarCents(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Small, dependency-free SVG bar chart — the dashboard previously used
 * <div> bars snapped to 10%-width Tailwind classes. Only a couple of chart
 * shapes are needed here, so a real charting library would be overkill.
 *
 * `format` is a string flag rather than a callback prop because this is
 * rendered from a Server Component — functions can't cross that boundary.
 */
export function BarChart({
  data,
  format = "zar-cents",
  height = 160,
}: {
  data: Array<{ label: string; value: number }>;
  format?: "zar-cents" | "number";
  height?: number;
}) {
  const formatValue = format === "zar-cents" ? formatZarCents : (v: number) => v.toLocaleString();
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = Math.max(2, (d.value / max) * (height - 24));
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - 24 - barHeight;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={w} height={barHeight} rx={1.5} className="fill-navy-600">
                <title>
                  {d.label}: {formatValue(d.value)}
                </title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 grid" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((d) => (
          <div key={d.label} className="text-center text-[10px] font-semibold text-navy-300">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
