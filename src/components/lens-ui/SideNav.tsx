"use client";

import type { ReactNode } from "react";
import type { PageId } from "./App";

type Item = { id: PageId; label: string; icon: ReactNode };

export const navItems: Item[] = [
  {
    id: "chat",
    label: "chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    id: "breakdown",
    label: "steps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "synaptic",
    label: "saved",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: "reflection",
    label: "reflect",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M12 2v2M12 20v2M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: "reminders",
    label: "remind",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export default function SideNav({
  current,
  onChange,
  locked = false,
}: {
  current: PageId;
  onChange: (p: PageId) => void;
  locked?: boolean;
}) {
  return (
    <aside className="hidden md:flex w-20 shrink-0 flex-col items-center pt-10">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4BDA8] to-[#E8A698] flex items-center justify-center shadow-sm mb-12">
        <span className="font-serif text-white text-base">c</span>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((it) => {
          const active = current === it.id;
          const disabled = locked && it.id !== "chat";
          return (
            <button
              key={it.id}
              onClick={() => !disabled && onChange(it.id)}
              disabled={disabled}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                active
                  ? "bg-[#3F4A3A] text-white"
                  : disabled
                  ? "text-[#D8CBBE] cursor-not-allowed"
                  : "text-[#8A7E72] hover:bg-white/60 hover:text-[#C97B6E]"
              }`}
              title={disabled ? "chat first" : it.label}
            >
              {it.icon}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}