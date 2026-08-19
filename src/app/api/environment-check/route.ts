import { NextRequest, NextResponse } from "next/server";
import { checkFrameWithGemini } from "@/lib/environment/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const frame: string = body.frame;

    if (!frame) {
      return NextResponse.json({ error: "Missing frame." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not set, skipping Gemini check.");
      return NextResponse.json({ check: null });
    }

    const check = await checkFrameWithGemini(frame, apiKey);
    return NextResponse.json({ check });
  } catch (err) {
    console.error("Environment check API error:", err);
    return NextResponse.json({ check: null });
  }
}
