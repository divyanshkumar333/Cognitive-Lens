import { NextRequest, NextResponse } from "next/server";
import { searchWeb } from "@/lib/search/tavily";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ results: [] });
    }
    const results = await searchWeb(query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("web-search route error:", err);
    return NextResponse.json({ results: [] });
  }
}
