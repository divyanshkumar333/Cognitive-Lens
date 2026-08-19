"use client";

import type { PageId } from "./App";
import { navItems } from "./SideNav";

export default function MobileNav({
  current,
  onChange,
  locked = false,
}: {
  current: PageId;
  onChange: (p: PageId) => void;
  locked?: boolean;
}) {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-20">
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_8px_32px_-12px_rgba(160,110,90,0.35)] px-2 py-2 flex items-center justify-between">
        {navItems.map((it) => {
          const active = current === it.id;
          const disabled = locked && it.id !== "chat";
          return (
            <button
              key={it.id}
              onClick={() => !disabled && onChange(it.id)}
              disabled={disabled}
              className={`flex-1 flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all duration-500 ${
                active ? "bg-[#FBE9DE]" : disabled ? "opacity-30" : "hover:bg-white/60"
              }`}
            >
              <span className={active ? "text-[#C97B6E]" : "text-[#8A7E72]"}>
                {it.icon}
              </span>
              <span className={`text-[10px] font-medium ${active ? "text-[#C97B6E]" : "text-[#8A7E72]"}`}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}