"use client";

import { useState } from "react";
import { AnalysisResult } from "@/types/analysis";
import { ConceptMap } from "./ConceptMap";

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultCard({ result, onReset }: Props) {
  const [completed, setCompleted] = useState<number[]>([]);
  const [activeAskIndex, setActiveAskIndex] = useState<number | null>(null);
  const [stepQuestion, setStepQuestion] = useState("");
  const [stepAnswers, setStepAnswers] = useState<Record<number, string>>({});
  const [askingStep, setAskingStep] = useState(false);

  const roadmap = result.roadmap ?? [];

  const toggleStep = (index: number) => {
    setCompleted((prev) => {
      const isNext = index === 0 || prev.includes(index - 1);
      if (!isNext) return prev;
      if (prev.includes(index)) return prev;
      return [...prev, index];
    });
  };

  const openAsk = (index: number) => {
    setActiveAskIndex((prev) => (prev === index ? null : index));
    setStepQuestion("");
  };

  const needsLiveSearch = (q: string) => {
    const triggers = [
      "near me",
      "cheap",
      "find",
      "where",
      "venue",
      "price",
      "cost",
      "current",
      "best",
      "recommend",
      "nearby",
      "local",
      "available",
    ];
    const lower = q.toLowerCase();
    return triggers.some((t) => lower.includes(t));
  };

  const handleAskStep = async (index: number, stepLabel: string) => {
    if (!stepQuestion.trim()) return;
    setAskingStep(true);
    try {
      let searchContext = "";

      if (needsLiveSearch(stepQuestion)) {
        const searchRes = await fetch("/api/web-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: `${stepLabel} ${stepQuestion}` }),
        });
        const searchData = await searchRes.json();
        const results = searchData.results ?? [];

        if (results.length > 0) {
          searchContext = `\n\nHere is real, current web search context to ground your answer:\n${results
            .map((r: any, i: number) => `${i + 1}. ${r.title}: ${r.content}`)
            .join("\n")}`;
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Answer this specific question about the step "${stepLabel}": ${stepQuestion}. Keep it short, concrete, and scoped only to this step - a few sentences max, not a general chat reply.${searchContext}`,
          history: [],
          resultContext: null,
          forceChat: true,
        }),
      });
      const data = await response.json();
      setStepAnswers((prev) => ({
        ...prev,
        [index]: data.reply ?? "No answer available.",
      }));
    } catch {
      setStepAnswers((prev) => ({
        ...prev,
        [index]: "Couldn't get an answer right now - try again.",
      }));
    } finally {
      setAskingStep(false);
    }
  };

  const allDone = completed.length === roadmap.length && roadmap.length > 0;

  return (
    <div className="cl-canvas" style={{ padding: "2rem 1rem" }}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--cl-green)",
              }}
            >
              Cognitive analysis
            </p>
            <h1
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 500,
                color: "var(--cl-text)",
              }}
            >
              {result.summary ?? result.diagnosis ?? "Analysis complete"}
            </h1>
          </div>

          <button
            onClick={onReset}
            className="cl-glass"
            style={{
              padding: "8px 18px",
              fontSize: 12,
              color: "var(--cl-green)",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            Start over
          </button>
        </div>

        <div className="cl-glass cl-glass-gap" style={{ padding: "1.5rem" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#8a5a1e",
            }}
          >
            Your first action
          </div>
          <p
            style={{
              marginTop: 10,
              fontSize: 19,
              fontWeight: 500,
              color: "var(--cl-text)",
            }}
          >
            {result.firstAction ??
              result.firstStep ??
              "Start with the first step."}
          </p>
        </div>

        <div className="cl-glass" style={{ padding: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  color: "var(--cl-text)",
                }}
              >
                Your pathway
              </h2>
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--cl-green)",
                  opacity: 0.6,
                }}
              >
                Tiny steps, not a checklist
              </p>
            </div>
            <span style={{ fontSize: 12, color: "var(--cl-green)" }}>
              {completed.length}/{roadmap.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {roadmap.map((step, index) => {
              const done = completed.includes(index);
              const available = index === 0 || completed.includes(index - 1);
              const askOpen = activeAskIndex === index;

              return (
                <div
                  key={index}
                  className="cl-glass"
                  style={{
                    borderRadius: 16,
                    opacity: available ? 1 : 0.4,
                    borderColor: done ? "var(--cl-green)" : undefined,
                    background: done ? "rgba(61,79,59,0.08)" : undefined,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: 14,
                    }}
                  >
                    <button
                      disabled={!available}
                      onClick={() => toggleStep(index)}
                      style={{
                        display: "flex",
                        flex: 1,
                        alignItems: "flex-start",
                        gap: 12,
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: available ? "pointer" : "default",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          height: 24,
                          width: 24,
                          flexShrink: 0,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          border: "1px solid var(--cl-glass-border)",
                          fontSize: 11,
                          color: "var(--cl-text)",
                        }}
                      >
                        {done ? "✓" : index + 1}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--cl-text)",
                          }}
                        >
                          {step.label}
                        </div>
                        {step.sub && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              color: "var(--cl-green)",
                            }}
                          >
                            {step.sub}
                          </div>
                        )}
                        {step.duration && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 10,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "var(--cl-green)",
                              opacity: 0.6,
                            }}
                          >
                            {step.duration}
                          </div>
                        )}
                      </div>
                    </button>

                    {available && (
                      <button
                        onClick={() => openAsk(index)}
                        title="Stuck on this step? Ask anything."
                        style={{
                          flexShrink: 0,
                          borderRadius: 999,
                          padding: "5px 11px",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          border: askOpen
                            ? "1px solid var(--cl-amber)"
                            : "1px solid var(--cl-glass-border)",
                          background: askOpen
                            ? "var(--cl-amber)"
                            : "transparent",
                          color: askOpen ? "#fff" : "var(--cl-green)",
                        }}
                      >
                        ?
                      </button>
                    )}
                  </div>

                  {askOpen && (
                    <div
                      style={{
                        margin: "0 14px 14px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.6)",
                        padding: 12,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--cl-green)",
                        }}
                      >
                        Stuck on this step? Ask anything.
                      </label>
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <input
                          autoFocus
                          value={stepQuestion}
                          onChange={(e) => setStepQuestion(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            handleAskStep(index, step.label)
                          }
                          placeholder="e.g. what counts as a venue here?"
                          style={{
                            flex: 1,
                            borderRadius: 10,
                            border: "1px solid var(--cl-glass-border)",
                            padding: "6px 10px",
                            fontSize: 13,
                            background: "rgba(255,255,255,0.7)",
                          }}
                        />
                        <button
                          onClick={() => handleAskStep(index, step.label)}
                          disabled={askingStep}
                          style={{
                            borderRadius: 10,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 500,
                            background: "var(--cl-green)",
                            color: "#fff",
                            border: "none",
                          }}
                        >
                          {askingStep ? "..." : "Ask"}
                        </button>
                      </div>
                      {stepAnswers[index] && (
                        <div
                          style={{
                            marginTop: 8,
                            borderRadius: 10,
                            background: "rgba(244,184,174,0.2)",
                            padding: 8,
                            fontSize: 13,
                            color: "var(--cl-text)",
                          }}
                        >
                          {stepAnswers[index]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {allDone && (
            <div
              style={{
                marginTop: 20,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--cl-green)",
              }}
            >
              You're moving.
            </div>
          )}
        </div>

        {result.environment && (
          <div className="cl-glass" style={{ padding: "1.25rem" }}>
            <h3
              style={{ fontSize: 15, fontWeight: 500, color: "var(--cl-text)" }}
            >
              Environment
            </h3>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 12,
                color: "var(--cl-green)",
              }}
            >
              <p>Noise: {result.environment.noise ?? "unknown"}</p>
              <p>Lighting: {result.environment.lighting ?? "unknown"}</p>
              <p>Clutter: {result.environment.clutter ?? "unknown"}</p>
            </div>
          </div>
        )}

        {result.concepts.length > 0 && (
          <ConceptMap
            nodes={result.concepts}
            edges={result.edges}
            onAskQuestion={async (nodeLabel, question) => {
              const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: `Answer this specific question about "${nodeLabel}": ${question}. Keep it short, concrete, and scoped only to this concept - a few sentences max, not a general chat reply.`,
                  history: [],
                  resultContext: null,
                  forceChat: true,
                }),
              });
              const data = await response.json();
              return data.reply ?? "No answer available.";
            }}
          />
        )}
      </div>
    </div>
  );
}
