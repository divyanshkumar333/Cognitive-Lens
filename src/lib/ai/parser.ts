import { AnalysisSchema } from "./schema";

export function parseAnalysis(data: unknown) {
  return AnalysisSchema.parse(data);
}
