export interface GeminiEnvironmentCheck {
  visibleClutterItems: number;
  lightingQuality: "good" | "dim" | "harsh_glare" | "unclear";
  confidence: number;
  note: string;
}

const PROMPT = `You are analyzing ONE still frame from a webcam pointed at someone's desk/workspace.

Report ONLY what is clearly visible in THIS frame. Do not guess, assume, or infer anything not directly observable.

Rules:
- If the frame is too dark, blurry, or unclear to tell, say so - do not fill in a guess.
- Do not invent objects, people, or details not visibly present.
- Do not speculate about the person's mood, identity, or intentions.
- Confidence must reflect actual visual certainty, not a default high number.
- Base "clutter" strictly on visible surface area covered by objects, not judgment about tidiness values.

Respond with ONLY this JSON, no other text, no markdown fences:
{
  "visible_clutter_items": <integer count of distinct loose objects on the visible desk surface, 0 if surface is clear or not visible>,
  "lighting_quality": "good" | "dim" | "harsh_glare" | "unclear",
  "confidence": <0-1, how certain you are given image quality>,
  "note": "<one short factual sentence, empty string if nothing notable>"
}`;

export async function checkFrameWithGemini(
  base64Jpeg: string,
  apiKey: string,
): Promise<GeminiEnvironmentCheck | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Jpeg,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 150,
          },
        }),
      },
    );

    if (!response.ok) {
      console.error("Gemini request failed:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      visibleClutterItems: Number(parsed.visible_clutter_items) || 0,
      lightingQuality: parsed.lighting_quality ?? "unclear",
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      note: typeof parsed.note === "string" ? parsed.note : "",
    };
  } catch (err) {
    console.error("Gemini environment check failed, continuing without it:", err);
    return null;
  }
}
