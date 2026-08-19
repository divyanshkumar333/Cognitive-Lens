"use client";

import { useMemo, useState } from "react";
import type { ConceptNode, ConceptEdge } from "@/types/analysis";

interface ConceptMapProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  onAskQuestion: (nodeLabel: string, question: string) => Promise<string>;
}

export function ConceptMap({ nodes, edges, onAskQuestion }: ConceptMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number }>();
    const cols = Math.max(nodes.length, 1);
    nodes.forEach((n, i) => {
      map.set(n.id, { x: ((i + 1) / (cols + 1)) * 100 });
    });
    return map;
  }, [nodes]);

  const openNode = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
    setQuestion("");
    setAnswer(null);
  };

  const handleAsk = async (label: string) => {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const reply = await onAskQuestion(label, question);
      setAnswer(reply);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="cl-glass" style={{ padding: "2rem", position: "relative" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "1rem",
          color: "var(--cl-green)",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        Synaptic space
      </div>

      <svg width="100%" viewBox="0 0 600 60" style={{ overflow: "visible" }}>
        {edges.map((edge, i) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const toNode = nodes.find((n) => n.id === edge.to);
          const isGap = toNode?.kind === "gap";
          return (
            <line
              key={i}
              x1={from.x * 6}
              y1={30}
              x2={to.x * 6}
              y2={30}
              stroke={isGap ? "var(--cl-amber)" : "var(--cl-green)"}
              strokeWidth={isGap ? 1.5 : 1}
              strokeDasharray={isGap ? "4 3" : undefined}
              opacity={0.4}
            />
          );
        })}
      </svg>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(nodes.length, 1)}, 1fr)`,
          gap: "12px",
          marginTop: "8px",
        }}
      >
        {nodes.map((node) => {
          const isGap = node.kind === "gap";
          const open = activeId === node.id;
          return (
            <div key={node.id}>
              <div
                onClick={() => openNode(node.id)}
                className={`cl-glass ${isGap ? "cl-glass-gap cl-gap-pulse" : ""}`}
                style={{
                  padding: "14px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  borderRadius: 16,
                }}
                title={node.description}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--cl-text)",
                  }}
                >
                  {node.label}
                </div>
                {isGap && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#8a5a1e",
                      background: "#FAEEDA",
                      borderRadius: 10,
                      padding: "2px 8px",
                      display: "inline-block",
                      marginTop: 4,
                    }}
                  >
                    gap detected
                  </div>
                )}
              </div>

              {open && (
                <div
                  className="cl-glass"
                  style={{ marginTop: 8, padding: 12, borderRadius: 14 }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      autoFocus
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAsk(node.label)
                      }
                      placeholder="Ask about this concept"
                      style={{
                        flex: 1,
                        fontSize: 13,
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: "1px solid var(--cl-glass-border)",
                        background: "rgba(255,255,255,0.6)",
                      }}
                    />
                    <button
                      onClick={() => handleAsk(node.label)}
                      disabled={asking}
                      style={{
                        fontSize: 12,
                        padding: "6px 12px",
                        borderRadius: 10,
                        background: "var(--cl-green)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      {asking ? "..." : "Ask"}
                    </button>
                  </div>
                  {answer && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "var(--cl-text)",
                      }}
                    >
                      {answer}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
