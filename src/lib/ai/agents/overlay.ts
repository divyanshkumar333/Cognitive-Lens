export interface OverlayResult {
  sections: {
    title: string;
    summary: string;
    importance: "high" | "medium" | "low";
  }[];

  readingMode:
    | "normal"
    | "simplified"
    | "focus";

  suggestions: string[];
}

export function createOverlay(text: string): OverlayResult {
  const lines = text
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const sections = lines.slice(0, 5).map((line, index) => ({
    title: `Section ${index + 1}`,
    summary:
      line.length > 120
        ? line.slice(0, 120) + "..."
        : line,
    importance:
      index === 0
        ? "high"
        : index < 3
        ? "medium"
        : "low",
  }));

  return {
    sections: sections as { title: string; summary: string; importance: "low" | "medium" | "high" }[],

    readingMode:
      text.length > 2000
        ? "focus"
        : text.length > 800
        ? "simplified"
        : "normal",

    suggestions: [
      "Increase spacing between ideas.",
      "Highlight key concepts.",
      "Reduce simultaneous information displayed.",
    ],
  };
}

