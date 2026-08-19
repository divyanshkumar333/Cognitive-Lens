import type { StructureAnalysis } from "./structure";
import type { EnvironmentState } from "./environment";
import type { MicroDecision } from "./microDecision";
import type { EmotionState } from "./emotion";
import type { OverlayResult } from "./overlay";
import { openai } from "@/lib/ai/openai";

export interface FinalResponse {
  summary: string;
  firstAction: string;
  interfaceMode: string;
  insights: string[];
  score: number;
  narration: string;
}

export async function createResponse(data: {
  structure?: StructureAnalysis;
  environment?: EnvironmentState;
  decision?: MicroDecision;
  emotion?: EmotionState;
  overlay?: OverlayResult;
}): Promise<FinalResponse> {
  const insights: string[] = [];

  let score = 20;

  if (data.structure?.estimatedComplexity === "medium") score += 15;
  if (data.structure?.estimatedComplexity === "high") score += 30;

  if (data.structure?.hasInformationOverload) {
    score += 20;
    insights.push(
      "This contains a high amount of information. The interface should reduce visible complexity."
    );
  }

  if (data.structure?.hasDecisionParalysis) {
    score += 15;
    insights.push("The user appears blocked by choosing where to begin.");
  }

  if (data.environment) {
    if (data.environment.noise === "high") score += 15;
    if (data.environment.clutter === "high") score += 10;
    if (data.environment.lighting === "dim") score += 5;

    insights.push(
      `Environment detected: ${data.environment.lighting} lighting, ${data.environment.noise} noise, ${data.environment.clutter} clutter.`
    );
  }

  if (data.emotion) {
    if (data.emotion.detected === "overwhelmed") score += 20;
    if (data.emotion.detected === "confused") score += 10;

    insights.push(`Response adjusted for ${data.emotion.detected} state.`);
  }

  score = Math.max(0, Math.min(score, 100));

  let summary = "Your task has been analyzed.";

  if (score >= 80) {
    summary =
      "High cognitive load detected. Your task has been simplified into the smallest possible actions.";
  } else if (score >= 60) {
    summary =
      "Moderate cognitive load detected. Your task has been reorganized to reduce mental effort.";
  } else {
    summary = "Your task appears manageable. Here's the fastest path forward.";
  }

  const firstAction =
    data.decision?.nextAction ?? "Choose the smallest possible first step.";

  const interfaceMode =
    data.overlay?.readingMode ?? data.environment?.recommendedMode ?? "normal";

  let narration = summary;

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are the Narrator Engine inside a cognitive assistance tool for neurodivergent users. " +
            "Given structured signals about a task and the user's environment, write ONE short paragraph " +
            "(2-3 sentences max) in plain, warm, direct language explaining WHY the interface made the " +
            "decisions it did. Do not list data back at the user. Connect cause to effect, e.g. " +
            "'Because your text had several stacked ideas with no clear order, I broke it into separate " +
            "steps instead of one block.' Never use bullet points. Never repeat raw numbers.",
        },
        {
          role: "user",
          content: JSON.stringify({
            cognitiveLoadScore: score,
            complexity: data.structure?.estimatedComplexity ?? "unknown",
            informationOverload: data.structure?.hasInformationOverload ?? false,
            decisionParalysis: data.structure?.hasDecisionParalysis ?? false,
            environment: data.environment ?? null,
            emotion: data.emotion?.detected ?? null,
            chosenInterfaceMode: interfaceMode,
            firstAction,
          }),
        },
      ],
      temperature: 0.6,
      max_tokens: 150,
    });

    narration = completion.choices[0]?.message?.content?.trim() ?? summary;
  } catch (err) {
    console.error("Narrator LLM call failed, falling back to summary:", err);
    narration = summary;
  }

  return {
    summary,
    score,
    firstAction,
    interfaceMode,
    insights,
    narration,
  };
}







