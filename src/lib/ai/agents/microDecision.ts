import { openai } from "@/lib/ai/openai";

export interface MicroDecision {
  goal: string;
  currentStep: string;
  nextAction: string;
  steps: string[];
  taskType: "physical" | "content" | "learning";
  draft?: string;
  requiresConfirmation: boolean;
  needsClarification?: boolean;
  clarifyingQuestion?: string;
}

export interface EnvironmentContext {
  brightness: number;
  glare: number;
  clutter: number;
  noise: number;
  status: string;
}

export interface GeminiCheckContext {
  visibleClutterItems: number;
  lightingQuality: string;
  confidence: number;
  note: string;
}

const FALLBACK: Omit<MicroDecision, "goal"> = {
  currentStep: "Start with one small physical action.",
  nextAction: "Identify the smallest possible first action.",
  steps: ["Identify the smallest possible first action."],
  taskType: "physical",
  requiresConfirmation: true,
};

const stepsCache = new Map<string, string[]>();

function hashInput(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `steps:${hash}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkNeedsClarification(input: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You help decide if a task description has enough concrete detail to build a specific, " +
            "useful step-by-step plan. IMPORTANT: a message can contain MULTIPLE separate tasks " +
            "bundled together, for example cleaning a room AND a project due. Judge EACH distinct " +
            "task separately, do not judge the message as one single unit. A task is self-explanatory " +
            "even without extra detail if it is something concrete and physical like cleaning a room, " +
            "organizing a desk, or replying to emails. A task is too vague to plan well if it mentions " +
            "a project, assignment, essay, report, presentation, or paper WITHOUT saying what it is " +
            "actually about. This is true even if other tasks in the same message are concrete. If " +
            "every distinct task mentioned already has enough detail, respond with exactly NONE. If " +
            "any task mentioned is missing its essential subject or topic, respond with ONE short " +
            "natural specific question under 15 words asking about that missing detail. Do not ask " +
            "about the parts that are already concrete.",
        },
        { role: "user", content: input },
      ],
      temperature: 0.2,
      max_tokens: 150,
      reasoning_effort: "low",
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "NONE";
    console.log("CLARIFY_CHECK_RAW:", raw);

    if (raw.toUpperCase().startsWith("NONE")) return null;
    return raw;
  } catch (err) {
    console.error("Clarification check failed, proceeding without it:", err);
    return null;
  }
}

function buildEnvironmentNote(
  environmentScore?: EnvironmentContext,
  geminiCheck?: GeminiCheckContext,
): string {
  if (!environmentScore && !geminiCheck) return "";

  let note = "";

  if (environmentScore) {
    note += `\n\nEnvironment context (from a live camera/mic read of the person's actual space, use it if genuinely relevant, ignore it if not): brightness ${environmentScore.brightness}/100, glare ${environmentScore.glare}/100, clutter ${environmentScore.clutter}/100, noise ${environmentScore.noise}/100, overall status "${environmentScore.status}".`;
  }

  if (geminiCheck && geminiCheck.confidence >= 0.5) {
    note +=
      `\n\nA vision model briefly checked ONE camera frame (low confidence readings are already filtered out, but still treat this as a rough signal, not certainty): it counted roughly ${geminiCheck.visibleClutterItems} loose item(s) on the visible desk surface, lighting was assessed as "${geminiCheck.lightingQuality}"` +
      (geminiCheck.note ? `, note: "${geminiCheck.note}"` : "") +
      `. Only mention this if it's genuinely useful - never state it as fact, never invent specific objects beyond what's given, and skip it entirely if unremarkable.`;
  }

  if (note) {
    note +=
      " If clutter or noise is notably high, you may reference it naturally in ONE early step (e.g. suggesting they clear just the immediate area or reduce background noise first) - but do not invent specific objects, and do not force a mention if the scores are unremarkable.";
  }

  return note;
}

async function getStepsWithRetry(
  input: string,
  environmentScore?: EnvironmentContext,
  geminiCheck?: GeminiCheckContext,
): Promise<string[]> {
  const cacheKey = hashInput(
    input +
      JSON.stringify(environmentScore ?? {}) +
      JSON.stringify(geminiCheck ?? {}),
  );
  const cached = stepsCache.get(cacheKey);
  if (cached) return cached;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are a Decision Engine for a cognitive assistance tool built for people with ADHD. " +
              "People with ADHD often aren't stuck on knowing the first action - they stall again a " +
              "step later because the next step is too big or unclear. Break the task into a SEQUENCE " +
              "of TINY, single-action steps, each completable in under 2 minutes without a big decision " +
              "attached. As many steps as the task genuinely needs based on complexity. Use the " +
              "person's own words for their task/subject. NEVER invent a specific file, folder, app, " +
              "piece of furniture, room feature, or object the person did not mention (e.g. do not say " +
              '"put it on the chair" or "place it in the drawer" unless they specifically mentioned ' +
              "a chair or drawer). When a step needs a physical destination or container, use a " +
              'generic, safe phrase instead - "set it aside", "put it in a pile", "move it to one ' +
              'spot" - rather than guessing at furniture or locations that may not exist. Do not ' +
              "repeat the full task name in every step. " +
              'Respond with ONLY a JSON object: {"steps": ["step one", "step two", "..."]}' +
              buildEnvironmentNote(environmentScore, geminiCheck),
          },
          { role: "user", content: input },
        ],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        reasoning_effort: "low",
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty completion");
      const parsed = JSON.parse(raw) as { steps?: string[] };
      if (parsed.steps && parsed.steps.length > 0) {
        stepsCache.set(cacheKey, parsed.steps);
        return parsed.steps;
      }
      throw new Error("No steps in parsed response");
    } catch (err) {
      const isLastAttempt = attempt === 1;
      console.error(
        `Decision Engine steps call failed (attempt ${attempt + 1}/2)${
          isLastAttempt ? ", using fallback" : ", retrying after backoff"
        }:`,
        err,
      );
      if (isLastAttempt) {
        return FALLBACK.steps;
      }
      await sleep(2500);
    }
  }
  return FALLBACK.steps;
}

const LEARNING_PATTERNS = [
  /\b(explain|understand|teach me|learn about|help me learn|what is|how does .* work|why does|why is)\b/i,
  /\b(recursion|photosynthesis|history of|causes of|theory of)\b/i,
];

export async function createMicroDecision(
  input: string,
  skipClarification = false,
  environmentScore?: EnvironmentContext,
  geminiCheck?: GeminiCheckContext,
): Promise<MicroDecision> {
  try {
    const looksLikeLearning = LEARNING_PATTERNS.some((p) => p.test(input));

    if (looksLikeLearning) {
      return {
        goal: input,
        currentStep: "Let's build understanding first.",
        nextAction: "Start the topic walkthrough.",
        steps: [],
        taskType: "learning",
        requiresConfirmation: false,
      };
    }

    if (!skipClarification) {
      const question = await checkNeedsClarification(input);
      if (question) {
        return {
          goal: input,
          currentStep: "",
          nextAction: "",
          steps: [],
          taskType: "physical",
          requiresConfirmation: false,
          needsClarification: true,
          clarifyingQuestion: question,
        };
      }
    }

    const routeCompletion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "Classify this task as one of three types:\n" +
            '"physical" - a CONCRETE PHYSICAL action in the real world: cleaning, organizing a ' +
            "room/desk, finding files, tidying, physically moving/sorting objects. If the task has " +
            "no physical object or space involved at all, it is NEVER physical, no matter how it is " +
            "phrased.\n" +
            '"content" - writing an essay, report, story, code, or generating original material, ' +
            "WHERE the person explicitly mentions or clearly implies they already have source " +
            'material, notes, or research to draw from (e.g. "using my notes", "based on chapter 3", ' +
            '"from the article I read").\n' +
            '"learning" - THE DEFAULT for any request to explain, teach, understand, or learn about ' +
            "a topic, concept, or subject - with NO physical object and NO existing source material " +
            'mentioned. "Explain photosynthesis", "help me understand recursion", "teach me about ' +
            'the French Revolution", and "I have a report due on X" (with no notes mentioned) are ' +
            "ALL learning, even if they mention writing a report at the end - the real work is " +
            "building understanding of the topic itself, not physically organizing anything.\n" +
            "When genuinely unsure between content and learning, choose learning - it is the safer " +
            "default for any topic-comprehension request.\n" +
            "Respond with ONLY one word: physical, content, or learning.",
        },
        { role: "user", content: input },
      ],
      temperature: 0,
      max_tokens: 5,
    });

    const routeRaw =
      routeCompletion.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
    const taskType: "physical" | "content" | "learning" = routeRaw.includes(
      "learning",
    )
      ? "learning"
      : routeRaw.includes("content")
        ? "content"
        : "physical";

    const finalTaskType: "physical" | "content" | "learning" =
      looksLikeLearning && taskType === "physical" ? "learning" : taskType;

    if (finalTaskType === "learning") {
      return {
        goal: input,
        currentStep: "Let's build understanding first.",
        nextAction: "Start the topic walkthrough.",
        steps: [],
        taskType: "learning",
        requiresConfirmation: false,
      };
    }

    if (finalTaskType === "physical") {
      const steps = await getStepsWithRetry(
        input,
        environmentScore,
        geminiCheck,
      );

      return {
        goal: input,
        currentStep: "Start with step one.",
        nextAction: steps[0],
        steps,
        taskType: "physical",
        requiresConfirmation: true,
      };
    }

    const draftCompletion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are a writing assistant inside a cognitive assistance tool for people with ADHD. " +
            "For ADHD, the hardest part of writing is often starting from a blank page - not the " +
            "editing or refining. Your job is to write a genuine, solid STARTING DRAFT of the " +
            "requested piece: a real thesis/argument, real structure, real content - not questions, " +
            "not an outline of headers, an actual draft with substance. " +
            "Keep it reasonably concise (a few solid paragraphs, not an exhaustive final essay) since " +
            "it is a starting point, not a finished product. Write it directly and confidently.",
        },
        { role: "user", content: input },
      ],
      temperature: 0.7,
      max_tokens: 900,
    });

    const draft = draftCompletion.choices[0]?.message?.content?.trim() ?? "";

    const steps = [
      "Read through the draft below - it's a real starting point, not a final answer.",
      "Rewrite the first paragraph in your own words and voice.",
      "Go through the rest, section by section, and change anything that doesn't sound like you or doesn't match what you actually think.",
      "Add at least one point or detail the draft doesn't have - something only you would know or think.",
      "Read it once more start to finish before calling it done.",
    ];

    return {
      goal: input,
      currentStep: "Start by reading the draft, then make it yours.",
      nextAction: steps[0],
      steps,
      taskType: finalTaskType,
      draft,
      requiresConfirmation: true,
    };
  } catch (err) {
    console.error("Decision Engine LLM call failed, using fallback:", err);
    return {
      goal: input,
      ...FALLBACK,
    };
  }
}