"use client";

import { useMemo, useState } from "react";
import ConceptMap, { ConceptNode, ConceptEdge } from "../ConceptMap";
import GapWalkthrough, { GapNode } from "../GapWalkthrough";
import ReportCard from "../ReportCard";

export default function SynapticPage({ analysis, topic }: { analysis?: any; topic?: string }) {
  const [report, setReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const nodes: ConceptNode[] = useMemo(() => {
    const concepts: string[] = analysis?.structure?.concepts ?? analysis?.dependencies?.nodes ?? [];
    const gapConcepts: string[] = (analysis?.dependencies?.gapNodes ?? []).map((g: any) => g.concept);
    return concepts.map((c) => ({
      id: c,
      label: c,
      kind: gapConcepts.includes(c) ? "gap" : "concept",
    }));
  }, [analysis]);

  const edges: ConceptEdge[] = useMemo(() => {
    return (analysis?.dependencies?.edges ?? []).map((e: any) => ({
      from: e.from,
      to: e.to,
      relation: e.relation,
    }));
  }, [analysis]);

  const gapNodes: GapNode[] = analysis?.dependencies?.gapNodes ?? [];
  const topicName = topic ?? analysis?.input ?? "this topic";

  const askConceptQuestion = async (nodeLabel: string, question: string): Promise<string> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `About the concept "${nodeLabel}": ${question}`,
          history: [],
          forceChat: true,
        }),
      });
      const data = await res.json();
      return data.reply ?? "Not sure, try exploring this concept a bit more.";
    } catch {
      return "Could not reach the server.";
    }
  };

  const fetchGapExplanation = async (concept: string, reason: string, topicArg: string): Promise<string> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Explain the concept "${concept}" as it relates to "${topicArg}". Context: ${reason}. Keep it short and clear.`,
          history: [],
          forceChat: true,
        }),
      });
      const data = await res.json();
      return data.reply ?? `Here is the key idea behind "${concept}": ${reason}.`;
    } catch {
      return `Here is the key idea behind "${concept}": ${reason}.`;
    }
  };

  const generateReport = async (notes: string[]) => {
    setReportLoading(true);
    try {
      const noteLines = gapNodes
        .map((g, i) => `${g.concept}: ${notes[i]?.trim() || "(no note taken)"}`)
        .join("\n");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            `Write a short, clear report about "${topicName}" based on these notes the user took ` +
            `while learning about each concept. Use their own understanding, don't just repeat the ` +
            `concept names. Keep it to a few short paragraphs.\n\nNotes:\n${noteLines}`,
          history: [],
          forceChat: true,
        }),
      });
      const data = await res.json();
      setReport(data.reply ?? "Could not generate a report right now.");
    } catch {
      setReport("Could not reach the server to generate the report.");
    } finally {
      setReportLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="max-w-3xl">
        <header className="mb-8">
          <h1 className="font-serif text-[32px] text-[#2B2F2A] tracking-tight leading-none">
            Synaptic space
          </h1>
          <p className="text-[12.5px] text-[#8A7E72] mt-1.5">your saved thoughts</p>
        </header>
        <div className="rounded-3xl bg-white/70 border border-white p-8 text-center text-[13px] text-[#8A7E72]">
          Send a task in chat to build your first concept map.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="font-serif text-[32px] text-[#2B2F2A] tracking-tight leading-none">
          Synaptic space
        </h1>
        <p className="text-[12.5px] text-[#8A7E72] mt-1.5">your saved thoughts</p>
      </header>

      <ReportCard analysis={analysis} />
      <ConceptMap nodes={nodes} edges={edges} onAskQuestion={askConceptQuestion} />

      {gapNodes.length > 0 && !report && !reportLoading && (
        <GapWalkthrough
          gapNodes={gapNodes}
          topic={topicName}
          onFetchExplanation={fetchGapExplanation}
          onComplete={generateReport}
        />
      )}

      {reportLoading && (
        <div className="rounded-3xl bg-white/70 border border-white p-6 text-[13px] text-[#8A7E72]">
          writing your report...
        </div>
      )}

      {report && (
        <div className="rounded-3xl bg-gradient-to-br from-[#FBE9DE] to-[#FCE3D8] border border-white p-6 space-y-3">
          <h2 className="font-serif text-[18px] text-[#2B2F2A]">your report</h2>
          <p className="text-[13.5px] text-[#4A4540] leading-relaxed whitespace-pre-wrap">{report}</p>
        </div>
      )}
    </div>
  );
}