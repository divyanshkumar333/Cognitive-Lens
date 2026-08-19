import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (text as string).trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    if (name.endsWith(".pdf")) {
      try {
        const text = await extractPdfText(buffer);

        if (!text) {
          return NextResponse.json(
            { error: "Couldn't extract text from that PDF." },
            { status: 422 },
          );
        }

        return NextResponse.json({ text });
      } catch (err) {
        console.error("PDF parsing failed:", err);
        return NextResponse.json(
          { error: "Couldn't read that PDF. Try a different file." },
          { status: 422 },
        );
      }
    }

    if (
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp")
    ) {
      try {
        const base64 = buffer.toString("base64");
        const mimeType = file.type || "image/png";

        const completion = await groq.chat.completions.create({
          model: "qwen/qwen3.6-27b",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "Extract all readable text and describe the task or content shown in this image. If it's a task, assignment, or note, transcribe it as plain text exactly as written. Respond with ONLY the extracted content, no commentary.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${base64}` },
                },
              ] as any,
            },
          ],
          max_tokens: 2000,
        });

        let text = completion.choices[0]?.message?.content?.trim();

        // qwen3.6-27b sometimes emits its reasoning wrapped in <think> tags -
        // strip that out, keep only the actual answer.
        if (text) {
          text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        }

        if (!text) {
          return NextResponse.json(
            { error: "Couldn't read that image. Try a text or PDF version instead." },
            { status: 422 },
          );
        }

        return NextResponse.json({ text });
      } catch (err) {
        console.error("Image parsing failed:", err);
        return NextResponse.json(
          { error: "Couldn't read that image right now. Try a text or PDF version instead." },
          { status: 422 },
        );
      }
    }

    return NextResponse.json(
      { error: "Unsupported file type. Use .txt, .pdf, .png, .jpg, or .jpeg." },
      { status: 400 },
    );
  } catch (err) {
    console.error("parse-document route error:", err);
    return NextResponse.json({ error: "Failed to process file." }, { status: 500 });
  }
}

