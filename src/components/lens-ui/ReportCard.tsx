"use client";

export default function ReportCard({ analysis }: { analysis?: any }) {
  const density = analysis?.structure?.mainIdeas?.length
    ? analysis.structure.mainIdeas.length > 3 ? "high" : "moderate"
    : "moderate";
  const decisionLoad = analysis?.decision?.roadmap?.length
    ? analysis.decision.roadmap.length > 5 ? "high" : "low"
    : "low";
  const gaps = analysis?.dependencies?.gapNodes?.length ?? 0;
  const ambiguity = analysis?.needsClarification ? "high" : "low";

  const rows = [
    { label: "Information density", value: density, tone: density === "high" ? "#E8A698" : "#5A6B52" },
    { label: "Decision load", value: decisionLoad, tone: decisionLoad === "high" ? "#E8A698" : "#5A6B52" },
    { label: "Hidden prerequisites", value: gaps > 0 ? `${gaps} found` : "none found", tone: gaps > 0 ? "#E0A458" : "#5A6B52" },
    { label: "Ambiguity", value: ambiguity, tone: ambiguity === "high" ? "#E8A698" : "#5A6B52" },
  ];

  return (
    <section className="rounded-3xl bg-white/70 border border-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-[18px] text-[#2B2F2A]">cognitive report</h2>
        <span className="text-[10px] uppercase tracking-wider text-[#8A7E72]">this task</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-2xl bg-white/70 border border-white p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#8A7E72] mb-1.5">{r.label}</div>
            <div className="text-[15px] font-medium" style={{ color: r.tone }}>{r.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}