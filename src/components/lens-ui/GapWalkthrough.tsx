"use client";

import { useState } from "react";

export type GapNode = { concept: string; reason: string };

interface Props {
  gapNodes: GapNode[];
  topic: string;
  onFetchExplanation: (concept: string, reason: string, topic: string) => Promise<string>;
  onComplete: (notes: string[]) => void;
}

export default function GapWalkthrough({ gapNodes, topic, onFetchExplanation, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
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
      const text = await onFetchExplanation(current.concept, current.reason, topic);
      setExplanation(text);
    } catch {
      setExplanation(`Here is the key idea behind "${current.concept}": ${current.reason}. Try writing down what you understand so far.`);
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    setNote("");
    setExplanation("");
    setStarted(false);
    if (isLast) {
      setFinished(true);
      onComplete(updatedNotes);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (finished) {
    return (
      <div className="rounded-3xl bg-white/85 border border-white p-6 space-y-4">
        <h2 className="font-serif text-[18px] text-[#2B2F2A]">Walkthrough complete</h2>
        <p className="text-[13px] text-[#8A7E72]">
          You went through every gap concept for {topic}. Here is what you wrote down:
        </p>
        <div className="space-y-2">
          {notes.map((n, i) => (
            <div key={i} className="rounded-xl bg-[#FBE9DE]/50 border border-white p-3 text-[13px]">
              <span className="font-medium text-[#2B2F2A]">{gapNodes[i]?.concept}: </span>
              <span className="text-[#4A4540]">{n || <span className="italic opacity-50">no note taken</span>}</span>
            </div>
          ))}
        </div>
        <div className="text-[12px] text-[#8A7E72] italic">generating your report below...</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/85 border border-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[18px] text-[#2B2F2A]">
          understanding gap {index + 1} of {gapNodes.length}
        </h2>
        <span className="text-[11px] text-[#8A7E72]">{current.concept}</span>
      </div>

      <p className="text-[13px] text-[#8A7E72]">{current.reason}</p>

      {!started && (
        <button
          onClick={loadCurrent}
          className="rounded-full bg-[#C97B6E] text-white px-4 py-2 text-[13px] font-medium"
        >
          explain this
        </button>
      )}

      {loading && <div className="text-[13px] text-[#8A7E72]">thinking...</div>}

      {started && !loading && explanation && (
        <>
          <div className="rounded-xl bg-[#FBE9DE]/50 border border-white p-4 text-[13px] leading-relaxed text-[#2B2F2A]">
            {explanation}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-[#8A7E72]">
              write what you understood, in your own words
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#E9D9CC] p-3 text-[13px] bg-white/80 focus:outline-none"
              placeholder="type your notes here..."
            />
          </div>
          <button
            onClick={handleNext}
            className="rounded-full bg-[#5A6B52] text-white px-4 py-2 text-[13px] font-medium"
          >
            {isLast ? "finish walkthrough" : "next concept"}
          </button>
        </>
      )}
    </div>
  );
}