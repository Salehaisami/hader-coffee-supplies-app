import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-image
 *
 * Generates an AI product image via Together.ai FLUX 1.1 Pro with a
 * consistent warm studio background matching the Hader catalog style.
 *
 * Body: JSON with:
 *   - prompt: description of the product (e.g. "A glass jar of honey")
 *
 * Returns: JPEG image blob (1024x1024)
 */

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "";
const MODEL = "black-forest-labs/FLUX.1.1-pro";

// Background prompt suffix for consistent catalog style
const BG_SUFFIX =
  "on a warm off-white background hex F6F4F1 very subtle warm cream tone not pure white soft studio lighting subtle shadow product catalog photography centered sharp focus";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt description is required" },
        { status: 400 }
      );
    }

    if (!TOGETHER_API_KEY) {
      return NextResponse.json(
        { error: "TOGETHER_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Append studio background style unless user already specified one
    const fullPrompt = prompt.toLowerCase().includes("background")
      ? prompt
      : `${prompt} ${BG_SUFFIX}`;

    const response = await fetch("https://api.together.ai/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: fullPrompt,
        width: 1024,
        height: 1024,
        n: 1,
      }),
    });

    const data = await response.json();

    if (!data.data || !data.data[0]) {
      throw new Error(
        `Together.ai failed: ${JSON.stringify(data).slice(0, 200)}`
      );
    }

    // Get image bytes (either from URL or base64)
    let imageBuffer: Buffer;

    if (data.data[0].url) {
      const imageResponse = await fetch(data.data[0].url);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else if (data.data[0].b64_json) {
      imageBuffer = Buffer.from(data.data[0].b64_json, "base64");
    } else {
      throw new Error("No image data returned from Together.ai");
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": "inline; filename=generated.jpg",
      },
    });
  } catch (error) {
    console.error("[generate-image] Error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
