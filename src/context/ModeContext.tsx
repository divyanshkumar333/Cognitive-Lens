"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useEnvironment } from "@/hooks/useEnvironment";

export type Mode = "calm" | "focused" | "overwhelmed";

interface ModeContextValue {
  mode: Mode;
  label: string;
  noiseLevel: number;
  micGranted: boolean;
  visionRead: string;
  demoNoise: number | null;
  setDemoNoise: (n: number | null) => void;
}

const ModeContext = createContext<ModeContextValue>({
  mode: "focused",
  label: "getting a read...",
  noiseLevel: 0,
  micGranted: false,
  visionRead: "Reading the room...",
  demoNoise: null,
  setDemoNoise: () => {},
});

const visionPhrases: Record<Mode, string[]> = {
  calm: [
    "Soft light, tidy desk. Good conditions for deep work.",
    "Steady lighting, low clutter. This space is set up well.",
  ],
  focused: [
    "Decent lighting, a bit of activity nearby. Workable.",
    "Some movement in frame, lighting is fine.",
  ],
  overwhelmed: [
    "Busy visual field detected. Might be worth clearing your desk.",
    "A lot going on in view. Dimming things down could help.",
  ],
};

export function ModeProvider({ children }: { children: ReactNode }) {
  const env = useEnvironment();
  const [visionRead, setVisionRead] = useState("Reading the room...");
  const [demoNoise, setDemoNoise] = useState<number | null>(null);

  const effectiveNoise = demoNoise ?? env.noiseLevel;
  const effectiveMicGranted = demoNoise !== null ? true : env.microphoneGranted;

  const mode: Mode = useMemo(() => {
    if (!effectiveMicGranted) return "focused";
    if (effectiveNoise > 60) return "overwhelmed";
    if (effectiveNoise > 30) return "focused";
    return "calm";
  }, [effectiveNoise, effectiveMicGranted]);

  const label = useMemo(() => {
    const suffix = demoNoise !== null ? " (demo)" : "";
    if (!effectiveMicGranted) return "getting a read...";
    if (mode === "overwhelmed") return "a bit scattered" + suffix;
    if (mode === "focused") return "focused" + suffix;
    return "calm workspace" + suffix;
  }, [mode, effectiveMicGranted, demoNoise]);

  useEffect(() => {
    const phrases = visionPhrases[mode];
    const pick = phrases[Math.floor(Math.random() * phrases.length)];
    setVisionRead(pick);
  }, [mode]);

  return (
    <ModeContext.Provider
      value={{
        mode,
        label,
        noiseLevel: effectiveNoise,
        micGranted: effectiveMicGranted,
        visionRead,
        demoNoise,
        setDemoNoise,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}