import { z } from "zod";

export const AnalysisSchema = z.object({
  cognitiveState: z.string(),

  summary: z.string(),

  mainIdea: z.string(),

  concepts: z.array(z.string()),

  dependencies: z.array(z.string()),

  ambiguities: z.array(z.string()),

  firstAction: z.string(),

  roadmap: z.array(z.string()),

  microDecision: z.object({
    question: z.string(),

    options: z.array(z.string()),
  }),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
