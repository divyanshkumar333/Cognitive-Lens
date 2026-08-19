"use client";

import {
  Leaf,
  Focus,
  BrainCircuit,
  ChevronRight,
} from "lucide-react";

type Mode = "calm" | "focused" | "overwhelmed";

interface Props {
  mode?: Mode;
}

const config = {
  calm: {
    icon: Leaf,
    title: "Calm Mode",
    color: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    description:
      "Reduce stimulation and increase breathing room.",
  },

  focused: {
    icon: Focus,
    title: "Focused Mode",
    color: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
    description:
      "Keep context while removing unnecessary distractions.",
  },

  overwhelmed: {
    icon: BrainCircuit,
    title: "Overwhelmed",
    color: "bg-rose-100 text-rose-700",
    border: "border-rose-200",
    description:
      "Collapse secondary information and guide one step at a time.",
  },
};

export default function EnvironmentalCard({
  mode = "focused",
}: Props) {
  const current = config[mode];
  const Icon = current.icon;

  return (
    <section
      className={`rounded-[30px] border ${current.border} bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,.06)]`}
    >
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${current.color}`}
          >
            <Icon size={24} />
          </div>

          <div>

            <p className="text-sm text-zinc-500">
              Environmental Intelligence
            </p>

            <h2 className="text-xl font-semibold">
              {current.title}
            </h2>

          </div>

        </div>

      </div>

      <p className="mt-6 leading-7 text-zinc-500">
        {current.description}
      </p>

      <div className="mt-8 space-y-4">

        {[
          ["Spacing", "Expanded"],
          ["Noise Reduction", "Enabled"],
          ["Reading Density", "Reduced"],
          ["Focus Target", "Primary Content"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between rounded-2xl bg-zinc-50 px-5 py-4"
          >
            <span className="text-zinc-500">
              {k}
            </span>

            <span className="flex items-center gap-2 font-medium">

              {v}

              <ChevronRight size={16} />

            </span>

          </div>
        ))}

      </div>
    </section>
  );
}
