/**
 * generate-product-image.js
 *
 * Generates AI product images via Together.ai (FLUX 1.1 Pro) with a consistent
 * warm off-white background matching the Hader catalog style.
 *
 * Prerequisites:
 *   - Together.ai API key (set TOGETHER_API_KEY env var or edit KEY below)
 *   - Node.js 18+ (for native fetch)
 *
 * Usage:
 *   # Generate a single product image
 *   node scripts/generate-product-image.js --id "my-product" --prompt "A glass jar of honey"
 *
 *   # Generate from a JSON prompts file
 *   node scripts/generate-product-image.js --file prompts.json
 *
 *   # prompts.json format: [["product-id", "prompt text"], ...]
 *
 * Output: scripts/regenerated-images/{product-id}.jpg (1024x1024)
 */

const fs = require("fs"), path = require("path");

const KEY = process.env.TOGETHER_API_KEY || "tgp_v1_-TUhBFWehp6o0zOCoC6beDdPjWXGmupy7w8McR00J84";
const MODEL = "black-forest-labs/FLUX.1.1-pro";
const OUTPUT_DIR = path.join(__dirname, "regenerated-images");

// Background description baked into every prompt for consistency
const BG_SUFFIX = "on a warm off-white background hex F6F4F1 very subtle warm cream tone not pure white soft studio lighting subtle shadow product catalog photography centered sharp focus";

async function generate(id, prompt) {
  const fullPrompt = prompt.includes("background") ? prompt : `${prompt} ${BG_SUFFIX}`;

  const r = await fetch("https://api.together.ai/v1/images/generations", {
    method: "POST",
    headers: { "Authorization": "Bearer " + KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt: fullPrompt, width: 1024, height: 1024, n: 1 }),
  });

  const j = await r.json();
  if (j.data && j.data[0]) {
    if (j.data[0].url) {
      const ir = await fetch(j.data[0].url);
      fs.writeFileSync(path.join(OUTPUT_DIR, id + ".jpg"), Buffer.from(await ir.arrayBuffer()));
    } else if (j.data[0].b64_json) {
      fs.writeFileSync(path.join(OUTPUT_DIR, id + ".jpg"), Buffer.from(j.data[0].b64_json, "base64"));
    }
    return true;
  }
  throw new Error(JSON.stringify(j).slice(0, 200));
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  let prompts = [];

  // Parse arguments
  const idIdx = args.indexOf("--id");
  const promptIdx = args.indexOf("--prompt");
  const fileIdx = args.indexOf("--file");

  if (idIdx >= 0 && promptIdx >= 0) {
    // Single image mode
    prompts = [[args[idIdx + 1], args[promptIdx + 1]]];
  } else if (fileIdx >= 0) {
    // Batch from JSON file
    prompts = JSON.parse(fs.readFileSync(args[fileIdx + 1], "utf-8"));
  } else {
    console.log("Usage:");
    console.log("  node generate-product-image.js --id product-id --prompt \"description\"");
    console.log("  node generate-product-image.js --file prompts.json");
    console.log("\nSet TOGETHER_API_KEY env var or edit KEY in this file.");
    process.exit(0);
  }

  console.log(`Generating ${prompts.length} image(s)...\n`);
  let ok = 0;

  for (let i = 0; i < prompts.length; i++) {
    const [id, prompt] = prompts[i];
    const outFile = path.join(OUTPUT_DIR, id + ".jpg");

    // Skip if already exists and > 5KB
    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 5000) {
      console.log(`  [${i + 1}/${prompts.length}] SKIP ${id} (exists)`);
      ok++;
      continue;
    }

    process.stdout.write(`  [${i + 1}/${prompts.length}] ${id}...`);
    try {
      await generate(id, prompt);
      console.log(" done");
      ok++;
    } catch (e) {
      console.log(` FAIL: ${e.message.slice(0, 60)}`);
    }

    // Rate limit delay
    if (i < prompts.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${ok}/${prompts.length} generated -> ${OUTPUT_DIR}`);
}

main();
