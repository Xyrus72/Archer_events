/* Small vintage furniture shared across sections. */

/* four-point star, the one under the crest's ribbon */
export function Diamond({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" className={`inline-block shrink-0 ${className}`} aria-hidden="true">
      <path d="M10 0Q11.6 8.4 20 10 11.6 11.6 10 20 8.4 11.6 0 10 8.4 8.4 10 0Z" fill="currentColor" />
    </svg>
  );
}

/* diamonds pinned to the four corners of a relative parent (a frame) */
export function Corners({ className = "", size = "w-3.5 h-3.5" }) {
  const spots = [
    "-top-[7px] -left-[7px]",
    "-top-[7px] -right-[7px]",
    "-bottom-[7px] -left-[7px]",
    "-bottom-[7px] -right-[7px]",
  ];
  return spots.map((s) => <Diamond key={s} className={`absolute ${s} ${size} ${className}`} />);
}

/* the five sunrise bars from the crest, as a section ornament */
export function Sunrise({ className = "", flip = false }) {
  return (
    <svg
      viewBox="0 0 120 56"
      className={`${className} ${flip ? "-scale-x-100" : ""}`}
      aria-hidden="true"
      fill="currentColor"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const y = i * 11.5;
        const xs = 52 - i * 13;
        return <polygon key={i} points={`${xs + 4},${y} 120,${y} 120,${y + 7} ${xs},${y + 7}`} />;
      })}
    </svg>
  );
}

/* horizontal brand bands (rust / cream / olive) — divider between sections */
export function Stripes({ className = "" }) {
  return <div className={`stripes ${className}`} aria-hidden="true" />;
}
