export interface StickyNote {
  title: string;
  summary: string;
  importance: "low" | "medium" | "high";
  selector: string;
}

export interface StickyNotesAnalysis {
  notes: StickyNote[];
}

export function createStickyNotes(text: string): StickyNotesAnalysis {
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 80)
    .slice(0, 5);

  const notes: StickyNote[] = paragraphs.map((paragraph, index) => ({
    title: `Insight ${index + 1}`,

    summary:
      paragraph.length > 140 ? paragraph.slice(0, 140) + "..." : paragraph,

    importance: index === 0 ? "high" : index < 3 ? "medium" : "low",

    selector: "body",
  }));

  return {
    notes,
  };
}
