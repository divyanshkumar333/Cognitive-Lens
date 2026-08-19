import { NextRequest, NextResponse } from "next/server";
import { runOrchestrator } from "@/lib/ai/core/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const text = body.text;
    const skipClarification = body.skipClarification === true;
    const environmentScore = body.environmentScore ?? undefined;
    const geminiCheck = body.geminiCheck ?? undefined;

    console.log("ENV_SCORE_RECEIVED:", JSON.stringify(environmentScore));

    if (!text) {
      return NextResponse.json(
        { error: "Missing page content." },
        { status: 400 },
      );
    }

    const analysis = await runOrchestrator(
      text,
      skipClarification,
      environmentScore,
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze API Error:", error);

    return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
  }
}
