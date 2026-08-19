"use client";

import { Brain, Sparkles, ArrowRight } from "lucide-react";

interface CognitiveScanCardProps {
  scanning?: boolean;
  progress?: number;
}

export default function CognitiveScanCard({
  scanning = false,
  progress = 82,
}: CognitiveScanCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-white p-8 shadow-[0_30px_80px_rgba(0,0,0,.08)]">

      <div className="absolute right-[-50px] top-[-50px] h-44 w-44 rounded-full bg-[#F6D6CF]/40 blur-3xl" />

      <div className="relative z-10">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5D8CF]">

              <Brain size={24} />

            </div>

            <div>

              <p className="text-sm text-zinc-500">
                AI Cognitive Lens
              </p>

              <h2 className="text-xl font-semibold">
                Cognitive Scan
              </h2>

            </div>

          </div>

          <div className="rounded-full bg-[#F8EEE9] px-4 py-2 text-sm font-medium">

            {progress}%

          </div>

        </div>

        <div className="mt-8">

          <div className="mb-3 flex justify-between text-sm">

            <span className="text-zinc-500">
              {scanning ? "Scanning page..." : "Analysis Ready"}
            </span>

            <span className="font-medium">
              {progress}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[#F4F4F4]">

            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F2B9AA] to-[#D79A8C] transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">

          {[
            ["Density","High"],
            ["Ambiguity","Medium"],
            ["Prerequisites","3"],
            ["Decision Load","High"],
          ].map(([title,value])=>(
            <div
              key={title}
              className="rounded-2xl bg-[#FAFAFA] p-4"
            >

              <p className="text-xs uppercase tracking-wide text-zinc-400">
                {title}
              </p>

              <p className="mt-2 text-lg font-semibold">
                {value}
              </p>

            </div>
          ))}

        </div>

        <button className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#F2B9AA] py-4 font-semibold transition hover:scale-[1.02]">

          <Sparkles size={18} />

          Reveal Hidden Structure

          <ArrowRight size={18} />

        </button>

      </div>

    </section>
  );
}
