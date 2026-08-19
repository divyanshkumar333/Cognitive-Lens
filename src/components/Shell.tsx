"use client";

import { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8F5F1] text-zinc-900">

      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#F6CFC8] opacity-70 blur-3xl" />

        <div className="absolute right-[-180px] top-[120px] h-[420px] w-[420px] rounded-full bg-[#EFD7C6] opacity-60 blur-3xl" />

        <div className="absolute bottom-[-220px] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#F2E8DD] opacity-80 blur-3xl" />

      </div>

      <div className="absolute left-12 top-20 h-32 w-32 rounded-full border border-white/60" />
      <div className="absolute right-16 top-36 h-20 w-20 rounded-full border border-white/50" />
      <div className="absolute bottom-20 left-24 h-24 w-24 rounded-full border border-white/50" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-6 py-8">

        {children}

      </section>

    </main>
  );
}
