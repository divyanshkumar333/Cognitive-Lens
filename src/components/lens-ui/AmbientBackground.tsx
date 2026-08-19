"use client";

import { useMode } from "@/context/ModeContext";

const palette = {
  calm: {
    wash: "radial-gradient(120% 80% at 20% 0%, #E4E6DA 0%, #FDF1EA 45%, #FDEAE0 100%)",
    orb1: "radial-gradient(circle, #C9D6BE 0%, transparent 70%)",
    orb2: "radial-gradient(circle, #F7C8B8 0%, transparent 70%)",
    line: "#5A6B52",
    opacity: 0.08,
  },
  focused: {
    wash: "radial-gradient(120% 80% at 20% 0%, #FCE5D8 0%, #FDF1EA 45%, #FDEAE0 100%)",
    orb1: "radial-gradient(circle, #F7C8B8 0%, transparent 70%)",
    orb2: "radial-gradient(circle, #E0A458 0%, transparent 70%)",
    line: "#C97B6E",
    opacity: 0.1,
  },
  overwhelmed: {
    wash: "radial-gradient(120% 80% at 20% 0%, #F7C8B8 0%, #FBD7C7 45%, #FCE3D8 100%)",
    orb1: "radial-gradient(circle, #E8A698 0%, transparent 65%)",
    orb2: "radial-gradient(circle, #C97B6E 0%, transparent 60%)",
    line: "#A85F50",
    opacity: 0.14,
  },
};

export default function AmbientBackground() {
  const { mode } = useMode();
  const p = palette[mode];
  const restless = mode === "overwhelmed";

  return (
    <div className="absolute inset-0 -z-0 overflow-hidden transition-colors duration-1000" aria-hidden>
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: p.wash }}
      />

      <div
        className={`orb transition-all duration-1000 ${restless ? "breathe-fast" : "breathe"}`}
        style={{
          width: 520,
          height: 520,
          top: -160,
          right: -120,
          background: p.orb1,
        }}
      />
      <div
        className={`orb transition-all duration-1000 ${restless ? "breathe-fast" : "breathe"}`}
        style={{
          width: 460,
          height: 460,
          bottom: -180,
          left: -120,
          background: p.orb2,
          animationDelay: "2s",
        }}
      />
      <div
        className="orb transition-all duration-1000"
        style={{
          width: 360,
          height: 360,
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: p.orb1,
          opacity: 0.25,
        }}
      />

      {/* Hand-drawn coral / botanical linework, shifts with mode */}
      <svg
        className="absolute -right-6 top-16 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: p.opacity }}
        width="340"
        height="440"
        viewBox="0 0 340 440"
        fill="none"
      >
        <path d="M170 10 C 90 90, 70 180, 100 260 C 60 280, 40 340, 60 400" stroke={p.line} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M170 10 C 250 90, 270 180, 240 260 C 280 280, 300 340, 280 400" stroke={p.line} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M100 150 C 130 160, 150 180, 160 210" stroke={p.line} strokeWidth="1" strokeLinecap="round" />
        <path d="M240 150 C 210 160, 190 180, 180 210" stroke={p.line} strokeWidth="1" strokeLinecap="round" />
        <circle cx="170" cy="30" r="6" stroke={p.line} strokeWidth="1.2" />
      </svg>

      <svg
        className="absolute -left-10 bottom-24 pointer-events-none rotate-[8deg] transition-opacity duration-1000"
        style={{ opacity: p.opacity * 0.8 }}
        width="300"
        height="380"
        viewBox="0 0 300 380"
        fill="none"
      >
        <path d="M150 0 C 70 80, 70 200, 150 320 C 230 200, 230 80, 150 0 Z" stroke={p.line} strokeWidth="1.2" />
        <path d="M150 40 C 90 120, 90 200, 150 300" stroke={p.line} strokeWidth="0.9" />
        <path d="M150 40 C 210 120, 210 200, 150 300" stroke={p.line} strokeWidth="0.9" />
      </svg>

      {/* Loose hand-sketched scribble accents, only visible when overwhelmed */}
      {restless && (
        <svg
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{ opacity: 0.05 }}
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          preserveAspectRatio="none"
        >
          <path d="M40 80 Q 120 40 180 90 T 320 70" stroke="#A85F50" strokeWidth="2" fill="none" />
          <path d="M600 500 Q 680 460 720 500 T 780 480" stroke="#A85F50" strokeWidth="2" fill="none" />
          <path d="M100 500 Q 160 470 220 510" stroke="#A85F50" strokeWidth="2" fill="none" />
        </svg>
      )}

      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
        }}
      />
    </div>
  );
}