import { routeInput } from "../agents/router";
import { analyzeStructure } from "../agents/structure";
import { analyzeEnvironment } from "../agents/environment";
import {
  createMicroDecision,
  EnvironmentContext,
} from "../agents/microDecision";
import { analyzeEmotion } from "../agents/emotion";
import { createOverlay } from "../agents/overlay";
import { createResponse } from "../agents/response";
import { analyzeDependencies, extractSubConcepts } from "../agents/dependency";
import { analyzeAccessibility } from "../agents/accessibility";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runOrchestrator(
  input: string,
  skipClarification = false,
  environmentScore?: EnvironmentContext,
) {
  const route = routeInput(input);

  const result: Record<string, unknown> = {
    route,
  };

  if (route.agents.includes("microDecision")) {
    try {
      result.decision = await createMicroDecision(
        input,
        skipClarification,
        environmentScore,
      );
    } catch (err) {
      console.error("Decision stage failed, continuing without it:", err);
      result.decision = null;
    }
  }

  const decision = result.decision as {
    needsClarification?: boolean;
    clarifyingQuestion?: string;
    taskType?: string;
  } | null;

  if (decision?.needsClarification) {
    return {
      needsClarification: true,
      clarifyingQuestion: decision.clarifyingQuestion,
      input,
    };
  }

  if (route.agents.includes("structure")) {
    try {
      result.structure = await analyzeStructure(input);
    } catch (err) {
      console.error("Structure stage failed, continuing without it:", err);
      result.structure = null;
    }
  }

  await sleep(600);

  if (route.agents.includes("environment")) {
    result.environment = analyzeEnvironment({
      brightness: 0.5,
      noiseLevel: 0.7,
      clutterScore: 0.6,
    });
  }

  await sleep(600);

  const structure = result.structure as {
    mainIdeas?: string[];
    sections?: unknown[];
  } | null;

  const isLearning = decision?.taskType === "learning";

  if (isLearning) {
    try {
      const subConcepts = await extractSubConcepts(input);
      result.dependencies = await analyzeDependencies(subConcepts, []);
    } catch (err) {
      console.error(
        "Dependency stage (learning path) failed, continuing without it:",
        err,
      );
      result.dependencies = null;
    }
  } else if (structure) {
    try {
      result.dependencies = await analyzeDependencies(
        structure.mainIdeas ?? [],
        structure.sections ?? [],
      );
    } catch (err) {
      console.error("Dependency stage failed, continuing without it:", err);
      result.dependencies = null;
    }

    await sleep(600);

    try {
      result.accessibility = await analyzeAccessibility(
        input,
        structure.mainIdeas ?? [],
      );
    } catch (err) {
      console.error("Accessibility stage failed, continuing without it:", err);
      result.accessibility = null;
    }
  }

  if (route.agents.includes("emotion")) {
    result.emotion = analyzeEmotion(input);
  }

  if (route.agents.includes("overlay")) {
    result.overlay = createOverlay(input);
  }

  try {
    result.response = await createResponse(result);
  } catch (err) {
    console.error("Response stage failed, using minimal summary:", err);
    result.response = null;
  }

  const finalStructure = result.structure as {
    inputType?: string;
    estimatedComplexity?: string;
    mainIdeas?: string[];
  } | null;
  const finalDecision = result.decision as {
    nextAction?: string;
    steps?: string[];
    taskType?: string;
    draft?: string | null;
  } | null;
  const finalDependencies = result.dependencies as {
    nodes?: unknown[];
    edges?: unknown[];
    suggestedOrder?: unknown[];
    gapNodes?: unknown[];
  } | null;
  const finalAccessibility = result.accessibility as Record<
    string,
    unknown
  > | null;
  const finalOverlay = result.overlay as {
    readingMode?: string;
    suggestions?: unknown[];
  } | null;
  const finalEnvironment = result.environment as {
    recommendedMode?: string;
  } | null;
  const finalResponse = result.response as {
    summary?: string;
    insights?: unknown[];
    narration?: string;
  } | null;

  return {
    needsClarification: false,

    input,

    task: {
      type: finalStructure?.inputType ?? "unknown",
      complexity: finalStructure?.estimatedComplexity ?? "medium",
    },

    structure: {
      mainIdeas: finalStructure?.mainIdeas ?? [],
      sections: finalStructure?.sections ?? [],
      concepts: finalStructure?.mainIdeas ?? [],
    },

    decision: {
      firstAction:
        finalDecision?.nextAction ?? "Start with the smallest action.",
      roadmap: finalDecision?.steps ?? [],
      taskType: finalDecision?.taskType ?? "physical",
      draft: finalDecision?.draft ?? null,
    },

    environment: result.environment ?? null,

    dependencies: finalDependencies ?? {
      nodes: [],
      edges: [],
      suggestedOrder: [],
      gapNodes: [],
    },

    accessibility: finalAccessibility ?? {
      readingLevel: "standard",
      chunkingStrategy: "short_chunks",
      sensoryFlags: {
        denseText: false,
        longSentences: false,
        jargonHeavy: false,
        wallOfText: false,
      },
      simplifiedSummary: "",
      recommendedFontScale: "normal",
    },

    interface: {
      mode:
        finalOverlay?.readingMode ??
        finalEnvironment?.recommendedMode ??
        "normal",
      suggestions: finalOverlay?.suggestions ?? [],
    },

    explanation: {
      summary: finalResponse?.summary ?? "Analysis complete.",
      insights: finalResponse?.insights ?? [],
      narration:
        finalResponse?.narration ??
        finalResponse?.summary ??
        "Analysis complete.",
    },
  };
}
