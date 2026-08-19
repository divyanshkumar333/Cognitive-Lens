interface Props {
  onReady: () => void;
}

export function OverwhelmedOverlay({ onReady }: Props) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center pt-24 fade-up"
      style={{ background: "rgba(245,238,226,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div className="max-w-xs text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 breathe">
          <div className="h-8 w-8 rounded-full bg-terracotta/25 breathe-slow" />
        </div>
        <p className="font-display text-xl text-ink">Too much at once.</p>
        <p className="mt-2 mb-6 font-mono text-xs leading-relaxed text-ink-soft">
          The environment has simplified itself.
          <br />
          One breath. One thing.
        </p>
        <button
          onClick={onReady}
          className="rounded-full bg-ink px-6 py-2.5 font-display text-sm text-paper transition-transform hover:scale-[1.02]"
        >
          I&apos;m ready
        </button>
      </div>
    </div>
  );
}
