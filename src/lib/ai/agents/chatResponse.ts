import { openai } from "@/lib/ai/openai";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface EnvironmentScore {
  noiseLevel: number;
  micGranted: boolean;
}

const FALLBACK_REPLY =
  "I am having trouble responding right now. Try rephrasing, or ask again in a moment.";

function getMode(env?: EnvironmentScore): "calm" | "focused" | "overwhelmed" | "unknown" {
  if (!env || !env.micGranted) return "unknown";
  if (env.noiseLevel > 60) return "overwhelmed";
  if (env.noiseLevel > 30) return "focused";
  return "calm";
}

function describeEnvironment(mode: string): string {
  if (mode === "overwhelmed") {
    return (
      "The user's live environment reading shows HIGH noise / overwhelm right now. This is a hard " +
      "constraint, not a suggestion: reply in ONE short sentence only. No pleasantries, no multiple " +
      "options, no questions unless absolutely necessary. Give exactly one small next action."
    );
  }
  if (mode === "focused") {
    return (
      "The user's live environment reading shows MODERATE noise (focused state). Keep replies brief " +
      "and practical, 2-3 sentences max."
    );
  }
  if (mode === "calm") {
    return "The user's live environment reading shows LOW noise (calm state). Normal conversational length is fine.";
  }
  return "No live environment reading is available right now.";
}

export async function getChatResponse(
  history: ChatMessage[],
  resultContext: unknown | null,
  environmentScore?: EnvironmentScore
): Promise<string> {
  try {
    const mode = getMode(environmentScore);
    const systemPrompt =
      "You are the conversational layer of Cognitive Lens, a cognitive assistance tool built for " +
      "people with ADHD. Be brief, warm, and direct - a few sentences at most. If the user is asking " +
      "about their existing analysis result (provided below as JSON if available), answer using it " +
      "directly rather than guessing. If there is no result yet, just help conversationally. Never " +
      "repeat large blocks of the JSON verbatim - summarize in plain language.\n\n" +
      "If a request is something you shouldn't help with, briefly explain why in your own words the " +
      "first time, in one short sentence - do not just repeat a generic refusal. If the user pushes " +
      "back or asks again, you can be brief and consistent, but vary your wording naturally rather than " +
      "repeating the exact same sentence every time. Stay calm and non-judgmental, and if it fits, " +
      "gently redirect to something you can actually help with.\n\n" +
      "LIVE ENVIRONMENT CONTEXT: " + describeEnvironment(mode) + "\n\n" +
      (resultContext
        ? `Current analysis result:\n${JSON.stringify(resultContext)}`
        : "No analysis result exists yet for this session.");

    const maxTokens = mode === "overwhelmed" ? 60 : mode === "focused" ? 150 : 400;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.5,
      max_tokens: maxTokens,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    return raw && raw.length > 0 ? raw : FALLBACK_REPLY;
  } catch (err) {
    console.error("Chat response failed, using fallback:", err);
    return FALLBACK_REPLY;
  }
}