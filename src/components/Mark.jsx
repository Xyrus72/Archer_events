/* Text recreation of the Archer Events wordmark:
   angular ARCHER with a yellow-slashed A, EVENTS letterspaced beneath. */

/* word : sub = φ² (17/6.5, 27.5/10.5, 44.5/17) — the lockup itself sits on the golden ladder */
const SIZES = {
  sm: {
    word: "text-[17px]",
    sub: "text-[6.5px] tracking-[0.5em] [text-indent:0.5em] mt-[3px]",
    line: "w-[10.5px]",
  },
  md: {
    word: "text-[27.5px]",
    sub: "text-[10.5px] tracking-[0.52em] [text-indent:0.52em] mt-[4px]",
    line: "w-[17px]",
  },
  lg: {
    word: "text-[44.5px]",
    sub: "text-[17px] tracking-[0.55em] [text-indent:0.55em] mt-[6.5px]",
    line: "w-[27.5px]",
  },
};

export default function Mark({ size = "md", tone = "ink" }) {
  const s = SIZES[size];
  const text = tone === "paper" ? "text-paper" : "text-ink";
  const accent = tone === "paper" ? "text-goldb" : "text-gold";
  return (
    <span className="inline-flex flex-col items-center leading-none select-none">
      <span className={`font-display font-semibold uppercase tracking-[0.06em] -skew-x-6 ${text} ${s.word}`}>
        <span className={accent}>A</span>RCHER
      </span>
      <span className={`inline-flex items-center gap-2 font-body font-bold uppercase ${text} ${s.sub}`}>
        <i className={`h-0.5 bg-gold -skew-x-[35deg] ${s.line}`} />
        EVENTS
        <i className={`h-0.5 bg-gold -skew-x-[35deg] ${s.line}`} />
      </span>
    </span>
  );
}
