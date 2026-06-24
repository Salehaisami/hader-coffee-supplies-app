import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

/**
 * POST /api/process-image
 *
 * Accepts a raw product photo, removes its background via remove.bg,
 * composites it onto a warm studio background with a subtle shadow,
 * and returns the processed image as a JPEG blob.
 *
 * Body: FormData with:
 *   - file: the raw image file
 *   - productScale (optional): 0-1, default 0.72
 *
 * Returns: JPEG image blob (1024x1024)
 */

const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY || "";
const OUTPUT_SIZE = 1024;

// Warm sand/peach background color matching the Hader catalog style
const BG_COLOR = { r: 235, g: 216, b: 188 };

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productScale = parseFloat(formData.get("productScale") as string) || 0.72;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!REMOVEBG_API_KEY) {
      return NextResponse.json(
        { error: "REMOVEBG_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Step 1: Remove background via remove.bg
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const transparentPng = await removeBackground(fileBuffer);

    // Step 2: Composite onto studio background
    const processed = await compositeStudioImage(transparentPng, productScale);

    return new NextResponse(new Uint8Array(processed), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": "inline; filename=processed.jpg",
      },
    });
  } catch (error) {
    console.error("[process-image] Error:", error);
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Calls remove.bg API to get a transparent PNG of the subject.
 */
async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData();
  formData.append("image_file", new Blob([new Uint8Array(imageBuffer)]), "image.jpg");
  formData.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": REMOVEBG_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`remove.bg failed (${response.status}): ${errorText}`);
  }

  return Buffer.from(await response.arrayBuffer());
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

  // Create shadow layer
  const shadow = await createShadow(product, pw, ph);

  // Composite: background → shadow → product
  const result = await sharp(background)
    .composite([
      {
        input: shadow,
        left: xOff - 5,
        top: yOff + Math.round(ph * 0.4),
        blend: "multiply",
      },
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
 * Creates a warm sand/peach gradient background (1024x1024).
 * Lighter at top-right (simulating key light), darker at bottom-left.
 */
async function createStudioBackground(): Promise<Buffer> {
  // Create a solid base color, then overlay a subtle gradient via SVG
  const svg = `
    <svg width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}">
      <defs>
        <linearGradient id="grad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(245,230,205);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(215,195,168);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}" fill="url(#grad)" />
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Creates a blurred, semi-transparent shadow from the product silhouette.
 */
async function createShadow(
  productBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  // Squash vertically to simulate ground shadow
  const squashedHeight = Math.round(height * 0.3);

  return sharp(productBuffer)
    .resize(width, squashedHeight, { fit: "fill" })
    .blur(25)
    .modulate({ brightness: 0.2 })
    .ensureAlpha(0.4)
    .toBuffer();
}
