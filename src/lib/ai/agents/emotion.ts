export interface EmotionState {
  detected:
    | "overwhelmed"
    | "frustrated"
    | "confused"
    | "focused"
    | "neutral";

  responseStyle:
    | "short"
    | "step_by_step"
    | "encouraging"
    | "detailed";
}

export function analyzeEmotion(text: string): EmotionState {
  const input = text.toLowerCase();

  if (
    input.includes("overwhelmed") ||
    input.includes("too much") ||
    input.includes("can't handle")
  ) {
    return {
      detected: "overwhelmed",
      responseStyle: "short",
    };
  }

  if (
    input.includes("confused") ||
    input.includes("don't understand") ||
    input.includes("lost")
  ) {
    return {
      detected: "confused",
      responseStyle: "step_by_step",
    };
  }

  if (
    input.includes("angry") ||
    input.includes("frustrated") ||
    input.includes("annoyed")
  ) {
    return {
      detected: "frustrated",
      responseStyle: "encouraging",
    };
  }

  if (
    input.includes("working") ||
    input.includes("building") ||
    input.includes("focused")
  ) {
    return {
      detected: "focused",
      responseStyle: "detailed",
    };
  }

  return {
    detected: "neutral",
    responseStyle: "detailed",
  };
}
