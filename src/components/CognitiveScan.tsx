"use client";

import { useEffect, useMemo, useState } from "react";
import { ScanStage } from "@/types/analysis";

interface Props {
  rawText: string;
  onComplete: () => void;
}

interface AnalysisResponse {
  response?: {
    firstAction?: string;
    interfaceMode?: string;
  };
}

const stageLabels: Record<Exclude<ScanStage, "idle" | "ready">, string> = {
  scanning: "Reading",
  structuring: "Finding the shape",
};

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function CognitiveScan({ rawText, onComplete }: Props) {
  const [stage, setStage] =
    useState<Exclude<ScanStage, "idle" | "ready">>("scanning");

  const [litIndices, setLitIndices] = useState<Set<number>>(new Set());

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const words = useMemo(() => splitWords(rawText), [rawText]);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: rawText,
          }),
        });

        const data = await response.json();

        setAnalysis(data);
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    };

    runAnalysis();

    const t1 = setTimeout(() => setStage("structuring"), 1800);
    const t2 = setTimeout(() => onComplete(), 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== "scanning" || words.length === 0) return;

    const interval = setInterval(() => {
      setLitIndices((prev) => {
        const next = new Set(prev);

        for (let i = 0; i < 3; i++) {
          next.add(Math.floor(Math.random() * words.length));
        }

        if (next.size > 10) {
          const arr = Array.from(next);
          return new Set(arr.slice(arr.length - 8));
        }

        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [stage, words.length]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 animate-[spin_2.4s_linear_infinite]">
          <div
            className="absolute left-1/2 top-1/2 h-1/2 w-[2px] origin-top -translate-x-1/2"
            style={{
              background:
                "linear-gradient(to bottom, rgba(196,112,74,0.9), transparent)",
            }}
          />
        </div>

        <div className="relative h-3 w-3 rounded-full bg-terracotta breathe" />
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative h-2 w-2">
          <div className="absolute inset-0 rounded-full bg-terracotta" />
          <div className="absolute inset-0 animate-ping rounded-full bg-terracotta/40" />
        </div>

        <span className="text-sm text-ink-soft">{stageLabels[stage]}</span>
      </div>

      <div className="w-full max-w-2xl rounded-3xl border border-ink/10 bg-paper/70 p-8">
        <p className="font-display leading-relaxed text-ink-soft">
          {words.map((word, i) => (
            <span
              key={i}
              className="transition-all duration-300"
              style={{
                color: litIndices.has(i) ? "#C4704A" : undefined,
                opacity:
                  stage === "structuring" ? 1 : litIndices.has(i) ? 1 : 0.55,
                fontWeight: litIndices.has(i) ? 600 : undefined,
              }}
            >
              {word}{" "}
            </span>
          ))}
        </p>
      </div>

      {analysis?.response?.firstAction && (
        <div className="w-full max-w-2xl rounded-3xl border border-ink/10 bg-paper/70 p-6">
          <h3 className="text-lg text-ink">First Action</h3>

          <p className="mt-2 text-ink-soft">{analysis.response.firstAction}</p>

          <p className="mt-3 text-sm text-ink-soft">
            Mode: {analysis.response.interfaceMode}
          </p>
        </div>
      )}
    </div>
  );
}
