"use client";

import { useMode } from "@/context/ModeContext";

export default function ReflectionPage() {
  const { visionRead, mode } = useMode();

  const days = [
    { d: "M", v: 0.45 },
    { d: "T", v: 0.6 },
    { d: "W", v: 0.4 },
    { d: "T", v: 0.7 },
    { d: "F", v: 0.55 },
    { d: "S", v: 0.8 },
    { d: "S", v: 0.75 },
  ];
  const W = 100, H = 60;
  const step = W / (days.length - 1);
  const path = days.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${H - p.v * H}`).join(" ");

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="font-serif text-[32px] text-[#2B2F2A] tracking-tight leading-none">
          Reflection
        </h1>
        <p className="text-[12.5px] text-[#8A7E72] mt-1.5">a quiet look back</p>
      </header>

      <section className="rounded-3xl bg-gradient-to-br from-[#FBE9DE] via-[#FCE3D8] to-[#F7D6CB] border border-white p-7 sm:p-9 relative overflow-hidden">
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, #F4BDA8 0%, transparent 70%)" }}
        />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#A85F50] mb-3">this week</div>
          <p className="font-serif text-[24px] sm:text-[28px] text-[#2B2F2A] leading-snug">
            You returned to something hard,
            <span className="text-[#C97B6E]"> and that matters.</span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white/70 border border-white p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="#5A6B52" strokeWidth="1.5" className="w-4 h-4">
            <circle cx="12" cy="12" r="3" />
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#8A7E72] mb-1">
            environment read - {mode}
          </div>
          <p className="text-[13px] text-[#4A4540] leading-snug">{visionRead}</p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {[
          { n: "2", l: "returns" },
          { n: "1", l: "closed" },
          { n: "4", l: "pauses" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-white/70 border border-white p-4 text-center">
            <div className="font-serif text-[28px] text-[#C97B6E] leading-none">{s.n}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#8A7E72] mt-2">{s.l}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white/70 border border-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-[18px] text-[#2B2F2A]">your week</h2>
          <span className="text-[10px] uppercase tracking-wider text-[#8A7E72]">7 days</span>
        </div>
        <svg viewBox={`0 -5 ${W} ${H + 12}`} className="w-full h-32">
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8A698" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E8A698" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#rg)" />
          <path d={path} fill="none" stroke="#C97B6E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          {days.map((p, i) => (
            <g key={i}>
              <circle cx={i * step} cy={H - p.v * H} r="1.6" fill="#FBE9DE" stroke="#C97B6E" strokeWidth="0.6" />
              <text x={i * step} y={H + 6} textAnchor="middle" fontSize="3" fill="#8A7E72" fontFamily="DM Sans">
                {p.d}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex items-center justify-between text-[10px] text-[#8A7E72] mt-1">
          <span>tired</span>
          <span className="text-[#C97B6E]">present</span>
          <span>lively</span>
        </div>
      </section>
    </div>
  );
}