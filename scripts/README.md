# Scripts — Product Image Pipeline

Tools for generating and processing product catalog images for the Hader app.

## Scripts

### `generate-product-image.js` — AI-generated product images (non-branded)

Generates product images via Together.ai (FLUX 1.1 Pro) with a warm off-white
background baked into the prompt. For generic products (cups, lids, straws, etc.).

```bash
# Single image
node scripts/generate-product-image.js --id "my-cup" --prompt "A white paper coffee cup 12oz"

# Batch from JSON file (format: [["id", "prompt"], ...])
node scripts/generate-product-image.js --file prompts.json
```

Requires `TOGETHER_API_KEY` env var or edit the KEY constant in the file.
Output: `scripts/regenerated-images/{id}.jpg` (1024×1024)

### `process-branded-image.py` — Real brand product photos

Processes real product photos (Almarai, Nadec, etc.) by removing the background
with AI segmentation (rembg) and compositing onto a matching warm studio background
with natural shadow.

```bash
# Single image
python3 scripts/process-branded-image.py input.jpg output.jpg

# Batch directory
python3 scripts/process-branded-image.py --batch input-dir/ output-dir/

# Options
python3 scripts/process-branded-image.py input.jpg output.jpg \
  --shadow-opacity 0.5 \
  --product-scale 0.72 \
  --size 1024 \
  --quality 90
```

Requires: `pip install "rembg[cpu]" pillow numpy`

### `upload-to-storage.js` — Upload to Firebase Storage + update Firestore

Uploads all images from `regenerated-images/` to Firebase Storage and updates
each product's `imageUrl` field in Firestore.

```bash
node scripts/upload-to-storage.js
```

Requires the service account key file in this directory.

## Setup

```bash
cd scripts
npm install                    # installs firebase-admin, google-auth-library
pip install "rembg[cpu]" pillow numpy   # for branded image processing
```

## Workflow for new products

1. **Non-branded** (generic packaging/supplies):
   ```bash
   node generate-product-image.js --id "new-product" --prompt "description of the product"
   ```

2. **Branded** (real brand photos):
   - Download the product photo from noon.com or supplier
   - Run: `python3 process-branded-image.py photo.jpg regenerated-images/product-id.jpg`

3. **Upload all**:
   ```bash
   node upload-to-storage.js
   ```
