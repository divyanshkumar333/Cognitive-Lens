"use client";

import { Brain, Sparkles } from "lucide-react";
import CognitiveScanCard from "./CognitiveScanCard";
import EnvironmentalCard from "./EnvironmentalCard";

export default function Home() {
  return (
    <>

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-zinc-500">
            Good afternoon
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Cognitive Lens
          </h1>

        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-xl">

          <Brain className="h-6 w-6 text-zinc-700" />

        </div>

      </div>

      <div className="mt-12 rounded-[34px] bg-white p-8 shadow-[0_20px_70px_rgba(0,0,0,.08)]">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5D8CF]">

            <Sparkles className="h-5 w-5" />

          </div>

          <div>

            <p className="text-sm text-zinc-500">
              Ready to focus?
            </p>

            <h2 className="text-xl font-semibold">
              Start Cognitive Scan
            </h2>

          </div>

        </div>

        <p className="mt-8 leading-7 text-zinc-500">
          Reveal hidden structure, ambiguity, missing prerequisites
          and cognitive overload before you begin reading.
        </p>

        <button
          className="mt-10 h-14 w-full rounded-2xl bg-[#F2B9AA] text-base font-semibold text-zinc-900 transition hover:scale-[1.02] active:scale-95"
        >
          Begin Scan
        </button>

      </div>

      <div className="mt-8">
        <EnvironmentalCard />
      </div>

      <div className="mt-10">

        <h3 className="mb-4 text-lg font-semibold">
          Recent Scans
        </h3>

        <div className="space-y-4">

          {[1,2,3].map((item)=>(
            <div
              key={item}
              className="rounded-[26px] bg-white p-6 shadow-[0_15px_50px_rgba(0,0,0,.06)]"
            >
              <div className="flex justify-between">

                <div>

                  <h4 className="font-semibold">
                    Biology Notes
                  </h4>

                  <p className="mt-1 text-sm text-zinc-500">
                    High Cognitive Load
                  </p>

                </div>

                <div className="rounded-full bg-[#F8EEE9] px-3 py-2 text-sm">
                  84%
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

    </>
  );
}
