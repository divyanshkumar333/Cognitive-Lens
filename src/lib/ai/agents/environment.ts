export interface EnvironmentState {
  lighting: "bright" | "normal" | "dim";
  noise: "low" | "medium" | "high";
  clutter: "low" | "medium" | "high";

  recommendedMode: "focus" | "minimal" | "reading" | "highContrast";

  recommendations: string[];
}

export function analyzeEnvironment(data: {
  brightness: number;
  noiseLevel: number;
  clutterScore: number;
}): EnvironmentState {
  // Browser microphone returns values roughly between 0–100.
  // Brightness and clutter are normalized between 0–1.

  const lighting =
    data.brightness < 0.3 ? "dim" : data.brightness > 0.7 ? "bright" : "normal";

  const noise =
    data.noiseLevel < 20 ? "low" : data.noiseLevel < 60 ? "medium" : "high";

  const clutter =
    data.clutterScore < 0.3
      ? "low"
      : data.clutterScore < 0.7
        ? "medium"
        : "high";

  const recommendations: string[] = [];

  if (noise === "high") {
    recommendations.push("Your environment is noisy.");
    recommendations.push("Use headphones if available.");
    recommendations.push("Work in 10–15 minute focus sessions.");
  }

  if (noise === "medium") {
    recommendations.push("Some background noise detected.");
  }

  if (clutter === "high") {
    recommendations.push("Reduce visual clutter around your workspace.");
  }

  if (lighting === "dim") {
    recommendations.push("Increase room lighting.");
  }

  if (lighting === "bright") {
    recommendations.push("Reduce screen brightness to minimize eye strain.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Your environment looks suitable for focused work.");
  }

  let recommendedMode: "focus" | "minimal" | "reading" | "highContrast";

  if (noise === "high") {
    recommendedMode = "focus";
  } else if (clutter === "high") {
    recommendedMode = "minimal";
  } else if (lighting === "dim") {
    recommendedMode = "highContrast";
  } else {
    recommendedMode = "reading";
  }

  return {
    lighting,
    noise,
    clutter,
    recommendedMode,
    recommendations,
  };
}
