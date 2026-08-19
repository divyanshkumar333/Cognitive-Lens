"use client";

import { useRef, useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
}

const suggestions = [
  { icon: "📄", label: "Assignment" },
  { icon: "🎓", label: "Lecture notes" },
  { icon: "📑", label: "Research paper" },
  { icon: "✉️", label: "Email" },
  { icon: "💭", label: "Messy thought" },
];

export function DocumentDrop({ onSubmit }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] w-full items-center justify-center px-8 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-5xl font-light leading-[1.05] tracking-tight text-ink">
            What&apos;s on your <span className="italic text-terracotta">mind?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft/80">
            Drop in what&apos;s stuck, we&apos;ll find the shape.
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-ink/20 bg-paper/60 transition-all duration-700 focus-within:border-ink/40 focus-within:bg-paper/90">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber/5 via-transparent to-sage/5 opacity-0 transition-opacity duration-1000 group-focus-within:opacity-100" />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste or type here..."
            rows={3}
            className="relative w-full resize-none bg-transparent px-8 py-6 font-display text-lg text-ink placeholder:text-ink-soft/40 focus:outline-none"
          />

          <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 px-8 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {suggestions.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper-deep/60 px-2.5 py-1 text-[11px] text-ink-soft"
                >
                  <span className="text-base leading-none">{s.icon}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={text.trim().length === 0}
              className="rounded-full bg-ink px-5 py-2 font-display text-sm font-medium text-paper transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
            >
              Transform it
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-ink-soft/50">
          ⌘ + Enter to submit
        </div>
      </div>
    </div>
  );
}
