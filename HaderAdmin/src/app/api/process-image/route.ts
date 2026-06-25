import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { adminStorage } from "@/lib/firebase-admin";

/**
 * POST /api/process-image
 *
 * Accepts a raw product photo, removes its background via remove.bg,
 * composites it onto a warm studio background with a subtle shadow,
 * uploads the result to Firebase Storage, and returns the public URL.
 *
 * Body: FormData with:
 *   - file: the raw image file
 *   - productId: Firestore product document ID (for storage path)
 *   - productScale (optional): 0-1, default 0.72
 *
 * Returns: JSON { url: string } with the public download URL
 */

const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY || "";
const WITHOUTBG_API_KEY = process.env.WITHOUTBG_API_KEY || "";
const OUTPUT_SIZE = 1024;

// Warm sand/peach background color matching the Hader catalog style
const BG_COLOR = { r: 235, g: 216, b: 188 };

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;
    const productScale = parseFloat(formData.get("productScale") as string) || 0.72;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    if (!REMOVEBG_API_KEY && !WITHOUTBG_API_KEY) {
      return NextResponse.json(
        { error: "No background removal API key configured (REMOVEBG_API_KEY or WITHOUTBG_API_KEY)" },
        { status: 500 }
      );
    }

    // Step 1: Remove background
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const transparentPng = await removeBackground(fileBuffer);

    // Step 2: Composite onto studio background
    const processed = await compositeStudioImage(transparentPng, productScale);

    // Step 3: Upload to Firebase Storage (server-side, bypasses rules)
    const storagePath = `products/${productId}/image_${Date.now()}.jpg`;
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(processed, {
      contentType: "image/jpeg",
      metadata: { cacheControl: "public, max-age=86400" },
    });
    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("[process-image] Error:", error);
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Removes background using remove.bg (free tier: 50/month).
 * Falls back to withoutbg.com if remove.bg returns 402 (out of credits).
 */
async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  // Try remove.bg first (50 free/month)
  if (REMOVEBG_API_KEY) {
    const formData = new FormData();
    formData.append("image_file", new Blob([new Uint8Array(imageBuffer)]), "image.jpg");
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVEBG_API_KEY },
      body: formData,
    });

    if (response.ok) {
      return Buffer.from(await response.arrayBuffer());
    }

    // 402 = out of credits — fall through to withoutbg
    if (response.status !== 402) {
      const errorText = await response.text();
      throw new Error(`remove.bg failed (${response.status}): ${errorText}`);
    }
    console.warn("[process-image] remove.bg credits exhausted, falling back to withoutbg.com");
  }

  // Fallback: withoutbg.com
  if (WITHOUTBG_API_KEY) {
    const formData = new FormData();
    formData.append("image", new Blob([new Uint8Array(imageBuffer)]), "image.jpg");

    const response = await fetch("https://api.withoutbg.com/v1.0/image/remove-background", {
      method: "POST",
      headers: { "x-api-key": WITHOUTBG_API_KEY },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`withoutbg.com failed (${response.status}): ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("No background removal API key configured");
}

/**
 * Composites a transparent product image onto a warm studio background
 * with a directional gradient and subtle shadow.
 */
async function compositeStudioImage(
  transparentPng: Buffer,
  productScale: number
): Promise<Buffer> {
  // Create warm studio background with gradient
  const background = await createStudioBackground();

  // Resize product to fit within frame
  const maxDim = Math.round(OUTPUT_SIZE * productScale);
  const product = await sharp(transparentPng)
    .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const productMeta = await sharp(product).metadata();
  const pw = productMeta.width || maxDim;
  const ph = productMeta.height || maxDim;

  // Center product slightly below middle
  const xOff = Math.round((OUTPUT_SIZE - pw) / 2);
  const yOff = Math.round((OUTPUT_SIZE - ph) / 2) + 10;

  // Composite: background → product (no shadow — matches catalog style)
  const result = await sharp(background)
    .composite([
      {
        input: product,
        left: xOff,
        top: yOff,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

/**
 * Creates a warm sand/beige background (1024x1024).
 * Very subtle gradient — nearly uniform, matching the Hader catalog style.
 */
async function createStudioBackground(): Promise<Buffer> {
  const svg = `
    <svg width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}">
      <defs>
        <linearGradient id="grad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(240,228,200);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(230,218,190);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}" fill="url(#grad)" />
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}


