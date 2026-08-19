import { AnalysisResult } from "@/types/analysis";

// Placeholder analysis, standing in for the real Groq call.
// Shape matches exactly what /api/analyze will eventually return.
export const demoAnalysis: AnalysisResult = {
  score: 72,
  diagnosis:
    "This reads as three stacked tasks with no clear order, plus one undefined term doing a lot of work.",
  firstStep: "Reread just the first sentence. Don't touch the rest yet.",
  roadmap: [
    {
      label: "Open the document",
      sub: "Just read the title. No writing yet.",
      duration: "~30 sec",
    },
    {
      label: "Highlight the first paragraph",
      sub: "The thesis lives here.",
      duration: "~1 min",
    },
    {
      label: "Circle one thing you don't know",
      sub: "Ambiguity is information, not failure.",
      duration: "~1 min",
    },
    {
      label: "Write one question at the top",
      sub: "Now you have a starting point.",
      duration: "~2 min",
    },
  ],
  concepts: [
    { id: "c1", label: "Thesis", kind: "core", description: "The central claim the rest depends on." },
    { id: "c2", label: "Method", kind: "concept", description: "How the claim is supported." },
    { id: "c3", label: "Linear algebra", kind: "requirement", description: "Assumed background knowledge." },
    { id: "c4", label: "Dataset", kind: "concept", description: "What the method is applied to." },
    { id: "c5", label: "Citation missing", kind: "missing", description: "A claim with no source." },
    { id: "c6", label: "First step", kind: "action", description: "The smallest next move." },
  ],
  edges: [
    { from: "c1", to: "c2", relation: "requires" },
    { from: "c2", to: "c3", relation: "requires" },
    { from: "c2", to: "c4", relation: "defines" },
    { from: "c1", to: "c5", relation: "unclear" },
    { from: "c1", to: "c6", relation: "leads to" },
  ],
};
