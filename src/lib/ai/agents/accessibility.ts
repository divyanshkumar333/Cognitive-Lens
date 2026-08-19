import { openai } from "@/lib/ai/openai";

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

const FALLBACK: AccessibilityAnalysis = {
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
};

const cache = new Map<string, AccessibilityAnalysis>();

function hashInput(text: string, mainIdeas: string[]): string {
  const combined = text + "|" + mainIdeas.join(",");
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return `accessibility:${hash}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeAccessibility(
  text: string,
  mainIdeas: string[]
): Promise<AccessibilityAnalysis> {
  if (!text || text.trim().length === 0) {
    return FALLBACK;
  }

  const cacheKey = hashInput(text, mainIdeas);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "You are an Accessibility Engine for a cognitive assistance tool built for people with " +
              "ADHD, dyslexia, and other neurodivergent conditions. Given a piece of text and its main " +
              "ideas, judge how it should be presented so it's easiest to actually read and process - " +
              "not how to summarize its content. Respond with ONLY a JSON object, no markdown, in this " +
              "exact shape:\n" +
              '{\n' +
              '  "readingLevel": one of "simple" | "standard" | "dense",\n' +
              '  "chunkingStrategy": one of "single_block" | "short_chunks" | "one_at_a_time",\n' +
              '  "sensoryFlags": {\n' +
              '    "denseText": boolean,\n' +
              '    "longSentences": boolean,\n' +
              '    "jargonHeavy": boolean,\n' +
              '    "wallOfText": boolean\n' +
              '  },\n' +
              '  "simplifiedSummary": a 1-2 sentence plain-language restatement,\n' +
              '  "recommendedFontScale": one of "normal" | "large" | "extra_large"\n' +
              '}',
          },
          {
            role: "user",
            content: JSON.stringify({ text, mainIdeas }),
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty completion");

      const parsed = JSON.parse(raw) as Partial<AccessibilityAnalysis>;

      const result: AccessibilityAnalysis = {
        readingLevel: parsed.readingLevel ?? FALLBACK.readingLevel,
        chunkingStrategy: parsed.chunkingStrategy ?? FALLBACK.chunkingStrategy,
        sensoryFlags: {
          denseText: parsed.sensoryFlags?.denseText ?? FALLBACK.sensoryFlags.denseText,
          longSentences: parsed.sensoryFlags?.longSentences ?? FALLBACK.sensoryFlags.longSentences,
          jargonHeavy: parsed.sensoryFlags?.jargonHeavy ?? FALLBACK.sensoryFlags.jargonHeavy,
          wallOfText: parsed.sensoryFlags?.wallOfText ?? FALLBACK.sensoryFlags.wallOfText,
        },
        simplifiedSummary: parsed.simplifiedSummary ?? FALLBACK.simplifiedSummary,
        recommendedFontScale: parsed.recommendedFontScale ?? FALLBACK.recommendedFontScale,
      };

      cache.set(cacheKey, result);
      return result;
    } catch (err) {
      const isLastAttempt = attempt === 1;
      console.error(
        `Accessibility Engine LLM call failed (attempt ${attempt + 1}/2)${
          isLastAttempt ? ", using fallback" : ", retrying after backoff"
        }:`,
        err
      );
      if (isLastAttempt) {
        return FALLBACK;
      }
      await sleep(2500);
    }
  }

  return FALLBACK;
}
