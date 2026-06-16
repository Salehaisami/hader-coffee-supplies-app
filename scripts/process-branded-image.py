#!/usr/bin/env python3
"""
process-branded-image.py

Processes a branded product image (real photo) by removing its background
and compositing onto a warm studio-style background matching the AI-generated
product images used in the Hader catalog.

Background: Warm sand/peach (~#E8D5B8) with directional gradient and vignette.
Shadow: Natural side shadow cast to the left (light from top-right), 50% opacity.

Prerequisites:
    pip install "rembg[cpu]" pillow numpy

Usage:
    # Process a single image
    python3 scripts/process-branded-image.py input.jpg output.jpg

    # Process all images in a directory
    python3 scripts/process-branded-image.py --batch input-dir/ output-dir/

    # Adjust shadow and background intensity
    python3 scripts/process-branded-image.py input.jpg output.jpg --shadow-opacity 0.5 --product-scale 0.75
"""

import argparse
import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove


def create_studio_background(size=(1024, 1024)):
    """Warm sand/peach background with directional lighting gradient.
    Lighter at top-right, darker at bottom-left — simulating key light from above-right.
    Matches the Together.ai FLUX-generated product image style."""
    w, h = size
    bg_arr = np.zeros((h, w, 3), dtype=np.float32)

    for y in range(h):
        for x in range(w):
            ty = y / h
            tx = x / w
            # Directional light: lighter top-right, darker bottom-left
            light_factor = 1.0 - (ty * 0.12 + (1 - tx) * 0.06)
            # Base: warm sand ~#E8D5B8 (232, 213, 184)
            bg_arr[y, x] = [235 * light_factor, 216 * light_factor, 188 * light_factor]

    return Image.fromarray(np.clip(bg_arr, 0, 255).astype(np.uint8))


def create_natural_shadow(fg_image, offset_x=25, offset_y=15, blur_radius=40, opacity=0.5):
    """Natural side shadow cast to the left-bottom.
    Light source simulated from top-right. Shadow is squashed vertically
    to simulate perspective projection on a flat surface."""
    alpha = fg_image.split()[3]

    # Warm-tinted shadow (not pure black)
    shadow_color = Image.new("RGBA", fg_image.size, (40, 30, 15, 0))
    shadow_alpha = alpha.point(lambda p: int(p * opacity))
    shadow_color.putalpha(shadow_alpha)
    shadow_color = shadow_color.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    # Squash vertically to simulate surface perspective
    sw, sh = shadow_color.size
    squashed = shadow_color.resize((sw, int(sh * 0.5)), Image.LANCZOS)

    # Place on padded canvas with offset
    pad = blur_radius * 3
    canvas = Image.new("RGBA", (sw + pad * 2, sh + pad * 2), (0, 0, 0, 0))
    sx = pad - offset_x
    sy = pad + int(sh * 0.45) + offset_y
    canvas.paste(squashed, (sx, sy), squashed)

    return canvas, (pad, pad)


def process_image(input_bytes, product_scale=0.72, shadow_opacity=0.5, size=1024):
    """Remove background, add shadow, composite onto warm studio background."""
    # Remove background via AI segmentation
    output_bytes = remove(input_bytes)
    fg = Image.open(io.BytesIO(output_bytes)).convert("RGBA")

    # Scale product to fit within frame
    max_dim = int(size * product_scale)
    fg.thumbnail((max_dim, max_dim), Image.LANCZOS)

    # Create background
    bg = create_studio_background((size, size))
    canvas = bg.convert("RGBA")

    # Center product slightly below middle
    x_off = (size - fg.width) // 2
    y_off = (size - fg.height) // 2 + 10

    # Add shadow
    shadow_canvas, (pad_x, pad_y) = create_natural_shadow(
        fg, offset_x=25, offset_y=15, blur_radius=40, opacity=shadow_opacity
    )
    shadow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sx = x_off - pad_x
    sy = y_off - pad_y
    crop_l = max(0, -sx)
    crop_t = max(0, -sy)
    paste_x = max(0, sx)
    paste_y = max(0, sy)
    avail_w = min(shadow_canvas.width - crop_l, size - paste_x)
    avail_h = min(shadow_canvas.height - crop_t, size - paste_y)
    if avail_w > 0 and avail_h > 0:
        cropped = shadow_canvas.crop((crop_l, crop_t, crop_l + avail_w, crop_t + avail_h))
        shadow_layer.paste(cropped, (paste_x, paste_y))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    # Product on top
    product_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    product_layer.paste(fg, (x_off, y_off))
    canvas = Image.alpha_composite(canvas, product_layer)

    return canvas.convert("RGB")


def main():
    parser = argparse.ArgumentParser(description="Process branded product images for Hader catalog")
    parser.add_argument("input", help="Input image path or directory (with --batch)")
    parser.add_argument("output", help="Output image path or directory (with --batch)")
    parser.add_argument("--batch", action="store_true", help="Process all images in input directory")
    parser.add_argument("--shadow-opacity", type=float, default=0.5, help="Shadow opacity 0-1 (default: 0.5)")
    parser.add_argument("--product-scale", type=float, default=0.72, help="Product size relative to frame (default: 0.72)")
    parser.add_argument("--size", type=int, default=1024, help="Output image size in px (default: 1024)")
    parser.add_argument("--quality", type=int, default=90, help="JPEG quality (default: 90)")
    args = parser.parse_args()

    if args.batch:
        input_dir = Path(args.input)
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)

        extensions = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
        files = [f for f in input_dir.iterdir() if f.suffix.lower() in extensions]
        print(f"Processing {len(files)} images...\n")

        for f in sorted(files):
            out_path = output_dir / f"{f.stem}.jpg"
            sys.stdout.write(f"  {f.name}...")
            sys.stdout.flush()
            try:
                result = process_image(
                    f.read_bytes(),
                    product_scale=args.product_scale,
                    shadow_opacity=args.shadow_opacity,
                    size=args.size,
                )
                result.save(str(out_path), format="JPEG", quality=args.quality)
                print(f" done ({out_path.stat().st_size // 1024}KB)")
            except Exception as e:
                print(f" FAIL: {e}")

        print("\nDone!")
    else:
        input_path = Path(args.input)
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"Processing {input_path.name}...", end=" ")
        result = process_image(
            input_path.read_bytes(),
            product_scale=args.product_scale,
            shadow_opacity=args.shadow_opacity,
            size=args.size,
        )
        result.save(str(output_path), format="JPEG", quality=args.quality)
        print(f"done ({output_path.stat().st_size // 1024}KB)")


if __name__ == "__main__":
    main()
