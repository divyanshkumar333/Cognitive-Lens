"use client";

import { ConceptEdge, ConceptNode } from "@/types/analysis";

interface Props {
  concepts: ConceptNode[];
  edges: ConceptEdge[];
}

export function ConceptGraph({ concepts }: Props) {
  if (!concepts.length) return null;

  return (
    <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6 paper-shadow-soft">
      <div className="mb-4">
        <h3 className="font-display text-lg text-ink">Concept Map</h3>

        <p className="font-mono text-xs text-ink-soft/60">
          AI extracted the important concepts from your task.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {concepts.map((concept) => (
          <div
            key={concept.id}
            className="rounded-full border border-ink/10 bg-paper-deep px-4 py-2 transition hover:scale-105"
          >
            <div className="font-display text-sm font-medium">
              {concept.label}
            </div>

            <div className="mt-1 font-mono text-[10px] uppercase text-ink-soft/50">
              {concept.kind}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
