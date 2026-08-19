"use client";

import { useState, useMemo } from "react";
import { useMode } from "@/context/ModeContext";

type Step = { n: number; title: string; hint: string };

const fallbackSteps: Step[] = [
  { n: 1, title: "Gather what you already have", hint: "folders, notes, bookmarks, one place" },
  { n: 2, title: "Pick one small question", hint: "something you could answer in a sentence" },
  { n: 3, title: "Read the first paragraph", hint: "just one, you can stop there" },
  { n: 4, title: "Write one fact down", hint: "a single sentence is the whole task" },
  { n: 5, title: "Rest before the next one", hint: "five minutes of nothing counts" },
];

export default function BreakdownPage({ analysis, onStepComplete }: { analysis?: any; onStepComplete?: () => void }) {
  const { mode } = useMode();
  const focusMode = mode === "overwhelmed";

  const rawSteps: Step[] = useMemo(() => {
    const roadmap: string[] | undefined = analysis?.decision?.roadmap;
    if (roadmap && roadmap.length > 0) {
      return roadmap.map((title, i) => ({
        n: i + 1,
        title,
        hint: i === 0 ? "start here, small is fine" : "one thing at a time",
      }));
    }
    return fallbackSteps;
  }, [analysis]);

  const steps: Step[] = useMemo(() => {
    const cap = focusMode ? 3 : 8;
    return rawSteps.slice(0, cap).map((s, i) => ({ ...s, n: i + 1 }));
  }, [rawSteps, focusMode]);

  const firstAction: string | undefined = analysis?.decision?.firstAction;

  const [done, setDone] = useState<Set<number>>(new Set());
  const [on, setOn] = useState<Set<number>>(new Set([1]));
  const [activeStep, setActiveStep] = useState(1);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [qInput, setQInput] = useState("");
  const [qLoading, setQLoading] = useState(false);
  const [qReply, setQReply] = useState<Record<number, { q: string; a: string }[]>>({});

  const toggle = (n: number) => {
    const nd = new Set(done);
    if (nd.has(n)) {
      nd.delete(n);
    } else {
      nd.add(n);
      onStepComplete?.();
    }
    setDone(nd);
  };
  const start = (n: number) => {
    const no = new Set(on);
    no.add(n);
    setOn(no);
    setActiveStep(n);
  };
  const advance = (n: number) => {
    toggle(n);
    const next = steps.find((s) => s.n === n + 1);
    if (next) start(next.n);
  };

  const askQuestion = async (step: Step) => {
    const q = qInput.trim();
    if (!q || qLoading) return;
    setQLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `About this step: "${step.title}" (${step.hint}). Question: ${q}`,
          history: [],
          forceChat: true,
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Not sure, try starting anyway and adjust as you go.";
      setQReply((r) => ({ ...r, [step.n]: [...(r[step.n] ?? []), { q, a: reply }] }));
      setQInput("");
    } catch {
      setQReply((r) => ({
        ...r,
        [step.n]: [...(r[step.n] ?? []), { q, a: "Could not reach the server." }],
      }));
    } finally {
      setQLoading(false);
    }
  };

  const completed = done.size;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-serif text-[32px] text-[#2B2F2A] tracking-tight leading-none">
            Gentle steps
          </h1>
          <div className="text-right">
            <div className="font-serif text-[20px] text-[#C97B6E] tabular-nums leading-none">
              {completed}<span className="text-[#C0AC9C] text-[14px]">/{steps.length}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#8A7E72] mt-1">done</div>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[#F2E0D2] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E8A698] to-[#C97B6E] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {firstAction && <p className="text-[12.5px] text-[#8A7E72] italic">{firstAction}</p>}
        {focusMode && (
          <div className="rounded-xl bg-[#FCE3D8] border border-[#F0C9B8] px-4 py-2.5 text-[12px] text-[#A85F50] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C97B6E] pulse-fast" />
            focus mode is on, other steps are dimmed
          </div>
        )}
      </header>

      <section className="space-y-2.5">
        {steps.map((s) => {
          const isDone = done.has(s.n);
          const isOn = on.has(s.n);
          const isActive = s.n === activeStep;
          const dimmed = focusMode && !isActive;
          const qOpen = openQuestion === s.n;
          const thread = qReply[s.n] ?? [];

          return (
            <article
              key={s.n}
              className={`rounded-2xl border transition-all duration-500 ${
                dimmed ? "blur-[3px] opacity-30 scale-[0.98]" : "blur-0 opacity-100 scale-100"
              } ${
                isActive && focusMode && !isDone
                  ? "p-6 bg-white border-[#C97B6E] shadow-[0_8px_40px_-12px_rgba(160,110,90,0.4)]"
                  : "p-4 sm:p-5"
              } ${
                isDone
                  ? "bg-[#3F4A3A] border-[#3F4A3A] text-[#FBE9DE]"
                  : isOn && !(isActive && focusMode)
                  ? "bg-white/90 border-white shadow-[0_2px_20px_-10px_rgba(160,110,90,0.3)]"
                  : !isActive
                  ? "bg-white/40 border-white/60"
                  : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { toggle(s.n); if (isActive) advance(s.n); }}
                  className={`shrink-0 rounded-full flex items-center justify-center font-medium border transition-all ${
                    isActive && focusMode && !isDone ? "w-12 h-12 text-[14px]" : "w-10 h-10 text-[12px]"
                  } ${
                    isDone
                      ? "bg-[#FBE9DE] border-[#FBE9DE] text-[#3F4A3A]"
                      : isOn
                      ? "border-[#C97B6E] text-[#C97B6E]"
                      : "border-[#E9D9CC] text-[#A89687]"
                  }`}
                >
                  {isDone ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    s.n
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`leading-tight ${isActive && focusMode && !isDone ? "text-[18px]" : "text-[15px]"} ${isDone ? "text-[#FBE9DE]" : "text-[#2B2F2A]"}`}>
                    {s.title}
                  </h3>
                  <p className={`mt-1 leading-snug ${isActive && focusMode && !isDone ? "text-[13px]" : "text-[12px]"} ${isDone ? "text-[#FBE9DE]/60" : "text-[#8A7E72]"}`}>
                    {s.hint}
                  </p>
                </div>
                {!isOn && !isDone && (
                  <button
                    onClick={() => start(s.n)}
                    className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-[#C97B6E] hover:text-[#A85F50] px-2"
                  >
                    start
                  </button>
                )}
                <button
                  onClick={() => setOpenQuestion(qOpen ? null : s.n)}
                  title="ask about this step"
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                    isDone
                      ? "border-[#FBE9DE]/40 text-[#FBE9DE]/80"
                      : qOpen
                      ? "bg-[#C97B6E] border-[#C97B6E] text-white"
                      : "border-[#E9D9CC] text-[#A89687] hover:border-[#C97B6E] hover:text-[#C97B6E]"
                  }`}
                >
                  <span className="text-[13px] font-serif">?</span>
                </button>
              </div>

              {qOpen && (
                <div className={`mt-3.5 rounded-xl p-3.5 ${isDone ? "bg-white/10" : "bg-[#FBE9DE]/50 border border-white"}`}>
                  {thread.map((t, i) => (
                    <div key={i} className="mb-2 text-[13px] bg-white/70 rounded-lg px-3 py-2">
                      <div className="text-[#C97B6E] font-medium">{t.q}</div>
                      <div className="mt-1 text-[#4A4540]">{t.a}</div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && askQuestion(s)}
                      placeholder="ask about this step..."
                      disabled={qLoading}
                      className="flex-1 bg-white/80 rounded-lg px-3 py-2 text-[13px] focus:outline-none placeholder:text-[#B7A99C]"
                    />
                    <button
                      onClick={() => askQuestion(s)}
                      disabled={qLoading}
                      className="rounded-lg bg-[#3F4A3A] text-[#FBE9DE] px-3 py-2 text-[12px] font-medium disabled:opacity-50"
                    >
                      {qLoading ? "..." : "ask"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}