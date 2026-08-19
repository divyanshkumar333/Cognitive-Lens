"use client";

import { useState } from "react";
import type { GapNode } from "@/types/analysis";

interface WalkthroughStep {
  concept: string;
  reason: string;
  explanation: string;
}

interface Props {
  gapNodes: GapNode[];
  topic: string;
  onFetchExplanation: (
    concept: string,
    reason: string,
    topic: string,
  ) => Promise<string>;
  onComplete: () => void;
}

export function GapWalkthrough({
  gapNodes,
  topic,
  onFetchExplanation,
  onComplete,
}: Props) {
  const [index, setIndex] = useState(0);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  if (!gapNodes.length) return null;

  const current = gapNodes[index];
  const isLast = index === gapNodes.length - 1;

  async function loadCurrent() {
    setLoading(true);
    setStarted(true);
    try {
      const text = await onFetchExplanation(
        current.concept,
        current.reason,
        topic,
      );
      setExplanation(text);
    } catch {
      setExplanation(
        `Here's the key idea behind "${current.concept}": ${current.reason}. Try writing down what you understand so far.`,
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    setNotes((prev) => [...prev, note]);
    setNote("");
    setExplanation("");
    setStarted(false);

    if (isLast) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (finished) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-paper p-6 space-y-4">
        <h2 className="font-display text-lg font-medium text-ink">
          Walkthrough complete
        </h2>
        <p className="text-sm text-ink-soft">
          You've gone through every gap concept for {topic}. Here's what you
          wrote down along the way:
        </p>
        <div className="space-y-2">
          {notes.map((n, i) => (
            <div
              key={i}
              className="rounded-lg border border-ink/10 bg-paper-deep p-3 text-sm"
            >
              <span className="font-medium">{gapNodes[i]?.concept}: </span>
              {n || <span className="italic opacity-50">no note taken</span>}
            </div>
          ))}
        </div>
        <button
          onClick={onComplete}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white"
        >
          Write my report from these notes
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-ink">
          Understanding gap {index + 1} of {gapNodes.length}
        </h2>
        <span className="text-xs text-ink-soft">{current.concept}</span>
      </div>

      <p className="text-sm text-ink-soft">{current.reason}</p>

      {!started && (
        <button
          onClick={loadCurrent}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white"
        >
          Explain this
        </button>
      )}

      {loading && <div className="text-sm opacity-60">Thinking...</div>}

      {started && !loading && explanation && (
        <>
          <div className="rounded-lg border border-ink/10 bg-paper-deep p-4 text-sm leading-relaxed">
            {explanation}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-ink-soft">
              Write what you understood, in your own words
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-ink/20 p-3 text-sm"
              placeholder="Type your notes here..."
            />
          </div>

          <button
            onClick={handleNext}
            className="rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white"
          >
            {isLast ? "Finish walkthrough" : "Next concept"}
          </button>
        </>
      )}
    </div>
  );
}
