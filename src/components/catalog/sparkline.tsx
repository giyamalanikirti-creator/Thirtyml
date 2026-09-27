import { formatPaise } from "@/lib/utils";

/** 7-day price sparkline: tiny, quiet, informative. */
export function Sparkline({
  points,
  width = 120,
  height = 32,
}: {
  points: { at: string; price: number }[];
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * (width - 4) + 2;
      const y = height - 4 - ((p.price - min) / span) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <figure className="inline-flex flex-col">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Price over the last 7 days, between ${formatPaise(min)} and ${formatPaise(max)}`}
      >
        <polyline
          points={coords}
          fill="none"
          stroke="var(--dusk)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <figcaption className="text-[10px] text-moon-dim">
        7-day price
      </figcaption>
    </figure>
  );
}
