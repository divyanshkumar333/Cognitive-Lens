"use client";

import {
  Home,
  Brain,
  Network,
  Settings
} from "lucide-react";

const items = [
  {
    icon: Home,
    label: "Home",
    active: true,
  },
  {
    icon: Brain,
    label: "Scan",
  },
  {
    icon: Network,
    label: "Concepts",
  },
  {
    icon: Settings,
    label: "Settings",
  },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2">

      <div className="flex items-center justify-between rounded-[30px] border border-white/70 bg-white/85 px-4 py-3 shadow-[0_30px_80px_rgba(0,0,0,.12)] backdrop-blur-3xl">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                item.active
                  ? "bg-[#F2B9AA] text-black shadow-lg"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              <Icon size={22} strokeWidth={2} />
            </button>
          );
        })}

      </div>

    </nav>
  );
}
