"use client";

import { useCallback, useState, useRef } from "react";
import Image from "next/image";
import { useLocale } from "@/contexts/LocaleContext";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductImageManagerProps {
  /** Current image URL (for edit mode preview). */
  currentImageUrl?: string;
  /** Product ID for storage path. */
  productId: string;
  /** Called with the final download URL. */
  onImageReady: (url: string) => void;
}

type Tab = "upload" | "generate";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProductImageManager({
  currentImageUrl,
  productId,
  onImageReady,
}: ProductImageManagerProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl ?? null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Labels
  const labels = {
    uploadTab: isAr ? "رفع صورة" : "Upload Photo",
    generateTab: isAr ? "توليد بالذكاء الاصطناعي" : "Generate with AI",
    selectFile: isAr ? "اختر صورة المنتج" : "Select product photo",
    processing: isAr ? "جاري المعالجة..." : "Processing...",
    generating: isAr ? "جاري التوليد..." : "Generating...",
    uploading: isAr ? "جاري الرفع..." : "Uploading...",
    promptPlaceholder: isAr
      ? "وصف المنتج (مثال: علبة أكواب ورقية بيضاء 12 أونصة)"
      : "Describe the product (e.g. A box of white 12oz paper cups with lids)",
    generateBtn: isAr ? "توليد صورة" : "Generate Image",
    confirmBtn: isAr ? "اعتماد الصورة" : "Use This Image",
    retryBtn: isAr ? "إعادة المحاولة" : "Try Again",
    changeBtn: isAr ? "تغيير الصورة" : "Change Image",
    hint: isAr
      ? "ارفع صورة المنتج الحقيقية — سيتم إزالة الخلفية تلقائياً"
      : "Upload the real product photo — background will be removed automatically",
    generateHint: isAr
      ? "اكتب وصف المنتج وسنولّد صورة احترافية بالذكاء الاصطناعي"
      : "Describe the product and we'll generate a professional catalog image",
    generateNote: isAr
      ? "⚠️ التوليد مناسب للمنتجات العامة فقط. للمنتجات ذات العلامات التجارية (مثل المراعي، لوازم...)، ارفع صورة حقيقية وسنزيل الخلفية تلقائياً."
      : "⚠️ Generation works for generic products only. For branded items (e.g. Almarai, specific packaging), upload a real photo instead — we'll remove the background automatically.",
    noApiKey: isAr ? "مفتاح API غير مهيأ" : "API key not configured",
  };

  // ---- Upload & Process Flow ----

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        setError("File too large (max 10 MB)");
        return;
      }

      setProcessing(true);
      try {
        // Send to server-side processing API (handles bg removal + upload)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", productId);

        const res = await fetch("/api/process-image", { method: "POST", body: formData });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Processing failed");
        }

        setPreviewUrl(json.url);
        onImageReady(json.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed");
      } finally {
        setProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [productId, onImageReady]
  );

  // ---- Generate Flow ----

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setError(null);
    setProcessing(true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), productId }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Generation failed");
      }

      setPreviewUrl(json.url);
      onImageReady(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setProcessing(false);
    }
  }, [prompt, productId, onImageReady]);

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "upload"
              ? "bg-white text-ink shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {labels.uploadTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("generate")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "bg-white text-ink shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {labels.generateTab}
        </button>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="relative h-52 w-52 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
          <Image
            src={previewUrl}
            alt="Product image"
            fill
            className="object-cover"
            unoptimized={previewUrl.startsWith("blob:")}
          />
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-clay" />
            </div>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="space-y-2">
          <p className="text-xs text-ink-soft">{labels.hint}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? labels.processing : previewUrl ? labels.changeBtn : labels.selectFile}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div className="space-y-3">
          <p className="text-xs text-ink-soft">{labels.generateHint}</p>
          <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">{labels.generateNote}</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={labels.promptPlaceholder}
            rows={2}
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-clay/40"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={processing || !prompt.trim()}
            className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-clay-deep disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? labels.generating : labels.generateBtn}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-clay-deep">{error}</p>
      )}
    </div>
  );
}
