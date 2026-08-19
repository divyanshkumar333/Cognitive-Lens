"use client";

import { useEffect, useState } from "react";
import { useMode } from "@/context/ModeContext";

const STORAGE_KEY = "cognitive-lens-pet";

type StageKey = "seed" | "sprout" | "bud" | "bloom";

const stages: { min: number; key: StageKey }[] = [
  { min: 0, key: "seed" },
  { min: 3, key: "sprout" },
  { min: 7, key: "bud" },
  { min: 15, key: "bloom" },
];

function getStageKey(xp: number): StageKey {
  let key: StageKey = "seed";
  for (const s of stages) {
    if (xp >= s.min) key = s.key;
  }
  return key;
}

function Creature({ stage, mood }: { stage: StageKey; mood: string }) {
  const eyeShape = mood === "overwhelmed" ? "^ ^" : mood === "focused" ? "- -" : ". .";

  if (stage === "seed") {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44">
        <ellipse cx="22" cy="24" rx="12" ry="14" fill="#C97B6E" />
        <ellipse cx="22" cy="20" rx="7" ry="8" fill="#E8A698" opacity="0.6" />
        <circle cx="18" cy="24" r="1.6" fill="#2B2F2A" />
        <circle cx="26" cy="24" r="1.6" fill="#2B2F2A" />
      </svg>
    );
  }
  if (stage === "sprout") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <path d="M24 22 C 18 10, 14 8, 10 6" stroke="#5A6B52" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M24 22 C 30 10, 34 8, 38 6" stroke="#5A6B52" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="24" cy="30" rx="13" ry="15" fill="#C97B6E" />
        <circle cx="19" cy="30" r="1.8" fill="#2B2F2A" />
        <circle cx="29" cy="30" r="1.8" fill="#2B2F2A" />
        <path d="M20 35 Q 24 38 28 35" stroke="#2B2F2A" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (stage === "bud") {
    return (
      <svg width="52" height="52" viewBox="0 0 52 52">
        <path d="M26 24 C 18 8, 12 6, 6 4" stroke="#5A6B52" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M26 24 C 34 8, 40 6, 46 4" stroke="#5A6B52" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <ellipse cx="26" cy="16" rx="6" ry="7" fill="#E0A458" />
        <ellipse cx="26" cy="33" rx="14" ry="16" fill="#C97B6E" />
        <circle cx="21" cy="33" r="2" fill="#2B2F2A" />
        <circle cx="31" cy="33" r="2" fill="#2B2F2A" />
        <path d="M21 39 Q 26 43 31 39" stroke="#2B2F2A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="58" height="58" viewBox="0 0 58 58">
      <path d="M29 26 C 20 8, 12 6, 4 4" stroke="#5A6B52" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M29 26 C 38 8, 46 6, 54 4" stroke="#5A6B52" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <g transform="translate(29,12)">
        <ellipse cx="0" cy="-6" rx="5" ry="6" fill="#E8A698" />
        <ellipse cx="6" cy="0" rx="5" ry="6" fill="#E0A458" />
        <ellipse cx="-6" cy="0" rx="5" ry="6" fill="#E0A458" />
        <ellipse cx="0" cy="6" rx="5" ry="6" fill="#C97B6E" />
      </g>
      <ellipse cx="29" cy="38" rx="16" ry="18" fill="#C97B6E" />
      <circle cx="23" cy="38" r="2.2" fill="#2B2F2A" />
      <circle cx="35" cy="38" r="2.2" fill="#2B2F2A" />
      <path d="M22 45 Q 29 50 36 45" stroke="#2B2F2A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function PetWidget({ completedCount }: { completedCount: number }) {
  const { mode } = useMode();
  const [xp, setXp] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setXp(JSON.parse(saved).xp ?? 0);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setXp((prev) => {
      const next = Math.max(prev, completedCount);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: next }));
      } catch {}
      return next;
    });
  }, [completedCount, loaded]);

  const stageKey = getStageKey(xp);
  const moodRing =
    mode === "overwhelmed" ? "#E8A698" : mode === "focused" ? "#E0A458" : "#5A6B52";

  return (
    <div className="mt-6 pt-6 border-t border-white/60 flex flex-col items-center gap-2 w-full">
      <div
        className="rounded-full flex items-center justify-center breathe p-1.5 transition-all duration-500"
        style={{ border: `2px solid ${moodRing}`, background: "rgba(255,255,255,0.5)" }}
      >
        <Creature stage={stageKey} mood={mode} />
      </div>
      <span className="text-[9px] uppercase tracking-widest text-[#8A7E72] font-medium">{stageKey}</span>
      <span className="text-[8px] text-[#B7A99C]">{xp} steps</span>
    </div>
  );
}