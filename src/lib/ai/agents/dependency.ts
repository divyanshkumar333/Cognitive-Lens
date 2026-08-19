import { openai } from "@/lib/ai/openai";

export interface DependencyEdge {
  from: string;
  to: string;
  relation: "requires" | "informs" | "blocks";
}

export interface GapNode {
  concept: string;
  reason: string;
}

export interface DependencyAnalysis {
  nodes: string[];
  edges: DependencyEdge[];
  suggestedOrder: string[];
  gapNodes: GapNode[];
}

const FALLBACK: DependencyAnalysis = {
  nodes: [],
  edges: [],
  suggestedOrder: [],
  gapNodes: [],
};

const cache = new Map<string, DependencyAnalysis>();

function hashInput(mainIdeas: string[], sections: string[]): string {
  return `dependency:${JSON.stringify({ mainIdeas, sections })}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJson(raw: string): any {
  let cleaned = raw.trim();
  cleaned = cleaned
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in model output");
  }
  const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonSlice);
}

async function callDependencyModel(
  mainIdeas: string[],
  sections: string[],
): Promise<{
  edges?: DependencyEdge[];
  suggestedOrder?: string[];
  gapNodes?: GapNode[];
}> {
  const completion = await openai.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "You are a Dependency Engine for a cognitive assistance tool built for people with ADHD. " +
          "Given a list of ideas/sections from a task or learning material, identify which ones " +
          "logically depend on others, AND separately identify which concepts are likely gaps - " +
          "things that are referenced or used but not actually explained, meaning a learner would " +
          "likely get confused or lost at that point without outside help. " +
          "Reply with ONLY raw JSON, nothing else - no markdown fences, no explanation, no reasoning " +
          "text before or after. Output exactly this shape:\n" +
          '{"fromList":["a","b"],"toList":["c","d"],"relationList":["requires","blocks"],' +
          '"suggestedOrder":["a","c","b","d"],' +
          '"gapConcepts":["c"],"gapReasons":["mentioned but never actually explained"]}\n\n' +
          "fromList, toList, relationList are same-length parallel arrays: index i means fromList[i] " +
          "depends on toList[i] via relationList[i]. relationList values must each be one of: requires, " +
          "informs, blocks. requires = genuinely needs the other first. informs = helps but not " +
          "necessary. blocks = cannot physically start until the other is done. If items are mostly " +
          "independent, use empty arrays for fromList, toList, relationList.\n\n" +
          "gapConcepts and gapReasons are same-length parallel arrays: gapConcepts[i] is a concept " +
          "name from the nodes that is likely a genuine understanding gap, and gapReasons[i] is a " +
          "short (under 12 words) reason why. Only flag REAL likely gaps - do not flag every node, " +
          "only ones a learner would plausibly get stuck on. If nothing looks like a genuine gap, use " +
          "empty arrays for gapConcepts and gapReasons.",
      },
      {
        role: "user",
        content: JSON.stringify({ mainIdeas, sections }),
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
    response_format: { type: "json_object" },
    reasoning_effort: "low",
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty completion");

  const parsed = extractJson(raw) as {
    fromList?: string[];
    toList?: string[];
    relationList?: string[];
    suggestedOrder?: string[];
    gapConcepts?: string[];
    gapReasons?: string[];
  };

  const fromList = parsed.fromList ?? [];
  const toList = parsed.toList ?? [];
  const relationList = parsed.relationList ?? [];

  const edges: DependencyEdge[] = fromList
    .map((from, i) => {
      const to = toList[i];
      const relation = relationList[i];
      if (!from || !to || !relation) return null;
      if (
        relation !== "requires" &&
        relation !== "informs" &&
        relation !== "blocks"
      ) {
        return null;
      }
      return { from, to, relation } as DependencyEdge;
    })
    .filter((e): e is DependencyEdge => e !== null);

  const gapConcepts = parsed.gapConcepts ?? [];
  const gapReasons = parsed.gapReasons ?? [];

  const gapNodes: GapNode[] = gapConcepts
    .map((concept, i) => {
      const reason = gapReasons[i];
      if (!concept || !reason) return null;
      return { concept, reason } as GapNode;
    })
    .filter((g): g is GapNode => g !== null);

  return { edges, suggestedOrder: parsed.suggestedOrder ?? [], gapNodes };
}

export async function extractSubConcepts(topic: string): Promise<string[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "Break the given topic into EXACTLY 4 real, specific sub-concepts a learner would need " +
              "to understand it. Not generic filler - actual named concepts, causes, components, or " +
              "stages specific to this exact topic. You must return exactly 4 items, never fewer. " +
              "Reply with ONLY raw JSON, no markdown, exactly this shape: " +
              "{\"concepts\": [\"concept one\", \"concept two\", \"concept three\", \"concept four\"]}",
          },
          { role: "user", content: topic },
        ],
        temperature: 0.5,
        max_tokens: 300,
        response_format: { type: "json_object" },
        reasoning_effort: "low",
      });
      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty completion");
      const parsed = JSON.parse(raw) as { concepts?: string[] };
      if (parsed.concepts && parsed.concepts.length >= 2) {
        return parsed.concepts;
      }
      throw new Error("Too few concepts returned");
    } catch (err) {
      console.error(`Sub-concept extraction attempt ${attempt + 1} failed:`, err);
      if (attempt === 1) {
        return [`${topic} - background`, `${topic} - key factors`, `${topic} - outcomes`];
      }
    }
  }
  return [`${topic} - background`, `${topic} - key factors`, `${topic} - outcomes`];
}
export async function analyzeDependencies(
  mainIdeas: string[],
  sections: string[],
): Promise<DependencyAnalysis> {
  if (mainIdeas.length === 0 && sections.length === 0) {
    return FALLBACK;
  }

  const nodes = Array.from(new Set([...mainIdeas, ...sections]));
  const cacheKey = hashInput(mainIdeas, sections);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const parsed = await callDependencyModel(mainIdeas, sections);
      const result: DependencyAnalysis = {
        nodes,
        edges: parsed.edges ?? [],
        suggestedOrder:
          parsed.suggestedOrder && parsed.suggestedOrder.length > 0
            ? parsed.suggestedOrder
            : nodes,
        gapNodes: parsed.gapNodes ?? [],
      };
      cache.set(cacheKey, result);
      return result;
    } catch (err) {
      const isLastAttempt = attempt === 1;
      console.error(
        `Dependency Engine LLM call failed (attempt ${attempt + 1}/2)${
          isLastAttempt ? ", using fallback" : ", retrying after backoff"
        }:`,
        err,
      );
      if (isLastAttempt) {
        return { ...FALLBACK, nodes };
      }
      await sleep(2500);
    }
  }

  return { ...FALLBACK, nodes };
}
