"use client";

import { useMemo, useState } from "react";

export type ConceptNode = { id: string; label: string; kind: "concept" | "gap"; description?: string };
export type ConceptEdge = { from: string; to: string; relation: string };

interface ConceptMapProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  onAskQuestion: (nodeLabel: string, question: string) => Promise<string>;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

export default function ConceptMap({ nodes, edges, onAskQuestion }: ConceptMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const handleAsk = async (label: string) => {
    if (!question.trim() || asking) return;
    setAsking(true);
    try {
      const reply = await onAskQuestion(label, question);
      setAnswer(reply);
    } finally {
      setAsking(false);
    }
  };

  const layout = useMemo(() => {
    const w = 600;
    const h = 340;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 90;
    return nodes.map((node, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        node,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
  }, [nodes]);

  const findLayout = (key: string) =>
    layout.find((l) => norm(l.node.id) === norm(key) || norm(l.node.label) === norm(key));

  if (nodes.length === 0) {
    return (
      <div className="rounded-3xl bg-white/70 border border-white p-8 text-center text-[13px] text-[#8A7E72]">
        No concept map yet. Send a task in chat first.
      </div>
    );
  }

  return (
    <section className="rounded-3xl bg-white/70 border border-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-[18px] text-[#2B2F2A]">concept map</h2>
        <span className="text-[10px] uppercase tracking-wider text-[#8A7E72]">tap a node to ask</span>
      </div>

      <div className="relative mx-auto" style={{ width: 600, height: 340, maxWidth: "100%" }}>
        <svg width="100%" height="100%" viewBox="0 0 600 340" className="absolute inset-0 pointer-events-none">
          {edges.map((edge, i) => {
            const from = findLayout(edge.from);
            const to = findLayout(edge.to);
            if (!from || !to) return null;
            const isGap = to.node.kind === "gap";
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isGap ? "#E0A458" : "#5A6B52"}
                strokeWidth={isGap ? 1.6 : 1}
                strokeDasharray={isGap ? "5 3" : undefined}
                opacity={0.45}
              />
            );
          })}
        </svg>

        {layout.map(({ node, x, y }) => {
          const isGap = node.kind === "gap";
          const open = activeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => {
                setActiveId(open ? null : node.id);
                setQuestion("");
                setAnswer(null);
              }}
              title={node.description}
              className={`absolute rounded-full flex items-center justify-center text-center transition-all duration-300 border px-2 ${
                isGap ? "bg-[#FAEEDA] border-[#E0A458] pulse-fast" : open ? "bg-[#3F4A3A] border-[#3F4A3A]" : "bg-white border-white/90 hover:bg-white"
              }`}
              style={{
                left: x,
                top: y,
                width: 92,
                height: 92,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className={`text-[10.5px] font-medium leading-tight ${open ? "text-[#FBE9DE]" : "text-[#2B2F2A]"}`}>
                {node.label}
              </span>
            </button>
          );
        })}
      </div>

      {nodes.map((node) => {
        const open = activeId === node.id;
        if (!open) return null;
        return (
          <div key={node.id} className="mt-3 rounded-2xl bg-white/90 border border-white p-3">
            <div className="text-[11px] text-[#8A7E72] mb-2">asking about: {node.label}</div>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk(node.label)}
                placeholder="ask about this concept"
                className="flex-1 text-[12.5px] px-2.5 py-2 rounded-lg border border-[#E9D9CC] bg-white/80 focus:outline-none placeholder:text-[#B7A99C]"
              />
              <button
                onClick={() => handleAsk(node.label)}
                disabled={asking}
                className="text-[11px] px-3 py-2 rounded-lg bg-[#3F4A3A] text-[#FBE9DE] font-medium disabled:opacity-50"
              >
                {asking ? "..." : "ask"}
              </button>
            </div>
            {answer && <div className="mt-2 text-[12.5px] text-[#4A4540] leading-snug">{answer}</div>}
          </div>
        );
      })}
    </section>
  );
}