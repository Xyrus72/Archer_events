/* Char-split helper: renders a line of text as animatable .ch spans. */
export function SplitLine({ text, className = "" }) {
  return (
    <span className={`split-line ${className}`}>
      {[...text].map((c, i) =>
        c === " " ? (
          <span key={i} className="sp" />
        ) : (
          <span key={i} className="ch">{c}</span>
        )
      )}
    </span>
  );
}
