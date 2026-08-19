import { openai } from "@/lib/ai/openai";

export type AgentType =
  | "structure"
  | "environment"
  | "emotion"
  | "microDecision"
  | "overlay"
  | "response";

export interface RouteResult {
  agents: AgentType[];
}

export function routeInput(input: string): RouteResult {
  const text = input.toLowerCase();

  const agents: AgentType[] = ["structure"];

  if (
    text.includes("camera") ||
    text.includes("room") ||
    text.includes("desk") ||
    text.includes("noise") ||
    text.includes("surrounding") ||
    text.includes("environment")
  ) {
    agents.push("environment");
  }

  if (
    text.includes("overwhelmed") ||
    text.includes("stressed") ||
    text.includes("anxious") ||
    text.includes("burnt out") ||
    text.includes("panic")
  ) {
    agents.push("emotion");
  }

  agents.push("microDecision");
  agents.push("overlay");
  agents.push("response");

  return { agents };
}

export type MessageRoute = "pipeline" | "chat";

const GREETING_PATTERNS = [
  /^(hey|hi|hello|yo|sup|what'?s up|good (morning|afternoon|evening))[\s!.,?]*$/i,
  /^(thanks|thank you|ok|okay|cool|nice|great|got it)[\s!.,?]*$/i,
  /^(bye|goodbye|see ya)[\s!.,?]*$/i,
];

const CONTENT_CREATION_PATTERNS = [
  /write (me )?(an?|the)?\s*(essay|story|report|article|poem|script|code|paragraph|letter|speech)/i,
  /draft (me )?(an?|the)?/i,
  /can you write/i,
  /compose (an?|the)?/i,
  /generate (an?|the)?\s*(essay|story|report|article|code)/i,
];

const TASK_SIGNAL_PATTERNS = [
  /\b(due|deadline|assignment|project|essay|report|homework|exam|test|quiz)\b/i,
  /\b(clean|organize|tidy|declutter)\b.{0,20}\b(room|desk|house|apartment|space)\b/i,
  /\b(room|desk|house|apartment|space)\b.{0,20}\b(disaster|mess|messy|wreck|chaos|chaotic|cluttered|trashed)\b/i,
  /\b(disaster|mess|messy|wreck|chaos|chaotic|cluttered|trashed)\b.{0,20}\b(room|desk|house|apartment|space)\b/i,
  /\bhaven'?t (started|done|finished)\b/i,
  /\b(three|four|five|\d+)\s+(assignments|tasks|things|emails)\b/i,
  /\b(meeting|presentation|paper|chapter|book report)\b/i,
  /\b(explain|understand|teach me|learn about|help me learn)\b/i,
  /\bbudget\b.{0,30}\$?\d+|\$\d+.{0,30}\bbudget\b/i,
  /\b(plan|planning|organize|organizing)\b.{0,40}\b(party|trip|event|wedding|move|move-in)\b/i,
  /\bhaven't\s+(booked|found|picked|chosen|decided|planned)\b/i,
  /\b(turning|turns)\s+\d+\b/i,
  /\b\d+\s+(weeks?|days?|months?)\b.{0,30}\b(left|to|until|before)\b/i,
];

function isObviousGreeting(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length <= 3 && !/[a-zA-Z]{4,}/.test(trimmed)) return true;
  return GREETING_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function matchesContentCreation(message: string): boolean {
  return CONTENT_CREATION_PATTERNS.some((pattern) => pattern.test(message));
}

function matchesTaskSignal(message: string): boolean {
  return TASK_SIGNAL_PATTERNS.some((pattern) => pattern.test(message));
}

export async function classifyMessage(message: string): Promise<MessageRoute> {
  if (isObviousGreeting(message)) {
    return "chat";
  }

  if (matchesContentCreation(message) || matchesTaskSignal(message)) {
    return "pipeline";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "Classify the user message as either:\n" +
            '"pipeline" - the message describes ANY real task, assignment, deadline, chore, project, ' +
            "or thing they need to get done - even if phrased casually, conversationally, or as if " +
            'venting (e.g. "my room is a disaster and I have a project due" IS pipeline, not chat, ' +
            "even though it sounds conversational). Also pipeline: any request to write, draft, or " +
            "generate real content (essays, stories, code, reports).\n" +
            '"chat" - ONLY greetings, thanks, small talk, or a follow-up question about an existing ' +
            'plan/result that does NOT describe new work to be done (e.g. "what does X mean", "why ' +
            'is step 3 before step 5\", "hey", "thanks").\n' +
            "Default to pipeline whenever the message mentions anything the person needs to do, finish, " +
            "or accomplish - even briefly, even if buried in venting or casual phrasing. Only choose " +
            "chat when there is clearly no task being described at all.\n" +
            "Respond with ONLY one word: pipeline or chat.",
        },
        { role: "user", content: message },
      ],
      temperature: 0,
      max_tokens: 5,
    });

    const raw =
      completion.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
    return raw.includes("pipeline") ? "pipeline" : "chat";
  } catch (err) {
    console.error("Message classifier failed, defaulting to chat:", err);
    return "chat";
  }
}


