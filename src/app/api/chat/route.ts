import { NextRequest, NextResponse } from "next/server";
import { classifyMessage } from "@/lib/ai/agents/router";
import { getChatResponse, ChatMessage } from "@/lib/ai/agents/chatResponse";
import { runOrchestrator } from "@/lib/ai/core/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body.message;
    const history: ChatMessage[] = body.history ?? [];
    const resultContext = body.resultContext ?? null;
    if (!message) {
      return NextResponse.json({ error: "Missing message." }, { status: 400 });
    }
    const environmentScore = body.environmentScore ?? undefined;
    const skipClarification = body.skipClarification ?? false;
    const forceChat = body.forceChat === true;
    const route = forceChat ? "chat" : await classifyMessage(message);
    if (route === "pipeline") {
      const analysis = await runOrchestrator(
        message,
        skipClarification,
        environmentScore,
      );
      return NextResponse.json(analysis);
    }
    const reply = await getChatResponse(
      [...history, { role: "user", content: message }],
      resultContext,
      environmentScore
    );
    return NextResponse.json({
      route: "chat",
      reply,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Chat failed." }, { status: 500 });
  }
}