"use client";

import { EnvState, ScanStage } from "@/types/analysis";
import { envConfig } from "@/lib/theme";

interface Props {
  envState: EnvState;
  onEnvChange: (s: EnvState) => void;
  scanStage: ScanStage;
}

const envOrder: EnvState[] = ["calm", "focused", "overwhelmed"];

const stageText: Record<ScanStage, string> = {
  idle: "waiting",
  scanning: "reading",
  structuring: "finding the shape",
  ready: "ready",
};

export function TopBar({ envState, onEnvChange, scanStage }: Props) {
  return (
    <header className="relative z-20 flex items-center justify-between border-b border-ink/8 bg-paper/60 px-8 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9">
          <svg viewBox="0 0 40 40" className="h-full w-full">
            <circle cx="20" cy="20" r="18" fill="none" stroke="#3a3631" strokeWidth="1" opacity="0.2" />
            <circle cx="20" cy="20" r="12" fill="none" stroke="#3a3631" strokeWidth="1" opacity="0.4" />
            <circle cx="20" cy="20" r="6" fill="#3a3631" opacity="0.15" className="breathe" />
            <circle cx="20" cy="20" r="2" fill="#3a3631" />
            <circle cx="32" cy="20" r="1.5" fill="#c4704a" className="breathe" style={{ animationDelay: "1s" }} />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-lg font-medium leading-none tracking-tight text-ink">
            Cognitive Lens
          </span>
          <span className="mt-0.5 text-[11px] text-ink-soft/70">
            Adaptive environment
          </span>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-ink/8 bg-paper/80 px-3.5 py-1.5 md:flex">
        <div className="relative h-2 w-2">
          <div className={`absolute inset-0 rounded-full ${scanStage === "idle" ? "bg-ink-soft/30" : "bg-terracotta"}`} />
          {scanStage !== "idle" && <div className="absolute inset-0 animate-ping rounded-full bg-terracotta/40" />}
        </div>
        <span className="text-xs text-ink-soft">
          {stageText[scanStage]}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end sm:flex">
          <span className="text-[11px] text-ink-soft/60">environment</span>
          <span className="font-display text-sm font-medium text-ink">{envConfig[envState].label}</span>
        </div>
        <div className="flex items-center rounded-full border border-ink/10 bg-paper/80 p-1">
          {envOrder.map((s) => (
            <button
              key={s}
              onClick={() => onEnvChange(s)}
              className={`rounded-full px-3 py-1.5 text-xs transition-all duration-500 ${
                envState === s ? "bg-ink text-paper" : "text-ink-soft hover:bg-ink/5"
              }`}
            >
              {envConfig[s].label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
