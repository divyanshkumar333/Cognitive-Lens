import { openai } from "@/lib/ai/openai";

export interface StructureAnalysis {
  inputType:
    | "assignment"
    | "email"
    | "brain_dump"
    | "meeting_notes"
    | "article"
    | "unknown";

  estimatedComplexity: "low" | "medium" | "high";

  hasDecisionParalysis: boolean;

  hasInformationOverload: boolean;

  mainIdeas: string[];

  sections: string[];
}

const FALLBACK: StructureAnalysis = {
  inputType: "brain_dump",
  estimatedComplexity: "medium",
  hasDecisionParalysis: false,
  hasInformationOverload: false,
  mainIdeas: [],
  sections: [],
};

const cache = new Map<string, StructureAnalysis>();

function hashInput(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `structure:${hash}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeStructure(text: string): Promise<StructureAnalysis> {
  const cacheKey = hashInput(text);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are a Structure Engine for a cognitive assistance tool built for people with ADHD. " +
              "Analyze the given task/text and extract its real structure. Respond with ONLY a JSON " +
              "object, no markdown, in this exact shape:\n" +
              '{\n' +
              '  "inputType": one of "assignment" | "email" | "brain_dump" | "meeting_notes" | "article" | "unknown",\n' +
              '  "estimatedComplexity": one of "low" | "medium" | "high" (based on how much the person ' +
              'needs to juggle - number of distinct sub-tasks, ambiguity, and length),\n' +
              '  "hasDecisionParalysis": true if the person expresses being stuck on WHERE to start or ' +
              'unable to choose between options, false otherwise,\n' +
              '  "hasInformationOverload": true if the text contains many distinct pieces of information ' +
              'or feels like a dump of too much at once, false otherwise,\n' +
              '  "mainIdeas": an array of 2-5 SHORT noun-phrase labels ONLY (3-6 words each, like ' +
              '"Causes of the Revolution" or "Room clutter") for the core ideas/goals actually present. ' +
              'NEVER write full sentences. NEVER restate the whole task verbatim. Just short topic labels ' +
              '(empty array if none identifiable),\n' +
              '  "sections": an array of natural sub-parts or topics the text breaks into, as SHORT ' +
              'labels (not full sentences), if any (empty array if the text is a single simple thought)\n' +
              '}',
          },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        reasoning_effort: "low",
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty completion");

      const parsed = JSON.parse(raw) as Partial<StructureAnalysis>;

      const result: StructureAnalysis = {
        inputType: parsed.inputType ?? FALLBACK.inputType,
        estimatedComplexity: parsed.estimatedComplexity ?? FALLBACK.estimatedComplexity,
        hasDecisionParalysis: parsed.hasDecisionParalysis ?? FALLBACK.hasDecisionParalysis,
        hasInformationOverload: parsed.hasInformationOverload ?? FALLBACK.hasInformationOverload,
        mainIdeas: parsed.mainIdeas ?? FALLBACK.mainIdeas,
        sections: parsed.sections ?? FALLBACK.sections,
      };

      cache.set(cacheKey, result);
      return result;
    } catch (err) {
      const isLastAttempt = attempt === 1;
      console.error(
        `Structure Engine LLM call failed (attempt ${attempt + 1}/2)${
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
