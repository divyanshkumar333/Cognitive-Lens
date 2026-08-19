export interface CognitiveAnalysis {
  input: string;

  task: {
    type: string;
    complexity: "low" | "medium" | "high";
  };

  structure: {
    mainIdeas: string[];
    sections: string[];
    concepts: string[];
  };

  decision: {
    firstAction: string;
    roadmap: string[];
  };

  environment: {
    lighting: string;
    noise: string;
    clutter: string;
    recommendedMode: string;
  } | null;

  interface: {
    mode: string;
    suggestions: string[];
  };

  explanation: {
    summary: string;
    insights: string[];
  };
}

export type EnvState = "overwhelmed" | "calm" | "focused";

export type ScanStage = "idle" | "ready" | "scanning" | "structuring";

export interface ConceptNode {
  id: string;
  label: string;
  kind: string;
  description?: string;
}

export interface ConceptEdge {
  from: string;
  to: string;
  relation: string;
}

export interface RoadmapStep {
  label: string;
  sub?: string;
  duration?: string;
}

export interface AnalysisResult {
  score?: number;
  summary?: string;
  diagnosis?: string;
  firstAction?: string;
  firstStep?: string;
  roadmap: RoadmapStep[];
  concepts: ConceptNode[];
  edges: ConceptEdge[];
  emotion?: any;
  environment?: {
    lighting?: string;
    noise?: string;
    clutter?: string;
  } | null;
}





export interface AccessibilityAnalysis {
  readingLevel: "simple" | "standard" | "dense";
  chunkingStrategy: "single_block" | "short_chunks" | "one_at_a_time";
  sensoryFlags: {
    denseText: boolean;
    longSentences: boolean;
    jargonHeavy: boolean;
    wallOfText: boolean;
  };
  simplifiedSummary: string;
  recommendedFontScale: "normal" | "large" | "extra_large";
}

export interface AccessibilityAnalysis {
  readingLevel: "simple" | "standard" | "dense";
  chunkingStrategy: "single_block" | "short_chunks" | "one_at_a_time";
  sensoryFlags: {
    denseText: boolean;
    longSentences: boolean;
    jargonHeavy: boolean;
    wallOfText: boolean;
  };
  simplifiedSummary: string;
  recommendedFontScale: "normal" | "large" | "extra_large";
}

export interface GapNode { concept: string; reason: string; }
