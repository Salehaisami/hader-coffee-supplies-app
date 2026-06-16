"use client";

import { useCallback, useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ImageUploadProps {
  /** Current image URL (for edit mode preview). */
  currentImageUrl?: string;
  /** Storage path prefix – e.g. "products/{id}". */
  storagePath: string;
  /** Called with the download URL once upload completes. */
  onUploadComplete: (url: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImageUpload({
  currentImageUrl,
  storagePath,
  onUploadComplete,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only JPEG, PNG, and WebP images are accepted.");
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        setError("File size must be under 5 MB.");
        return;
      }

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Upload to Firebase Storage
      const storageRef = ref(storage, `${storagePath}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploading(true);
      setProgress(0);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(pct);
        },
        (uploadError) => {
          console.error("Upload failed:", uploadError);
          setError("Upload failed. Please try again.");
          setUploading(false);
          setProgress(0);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setPreviewUrl(downloadUrl);
            onUploadComplete(downloadUrl);
          } catch (urlError) {
            console.error("Failed to get download URL:", urlError);
            setError("Failed to get image URL. Please try again.");
          } finally {
            setUploading(false);
            setProgress(0);
          }
        }
      );
    },
    [storagePath, onUploadComplete]
  );

  return (
    <div className="space-y-3">
      {/* Preview */}
      {previewUrl && (
        <div className="relative h-48 w-48 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
          <Image
            src={previewUrl}
            alt="Product image preview"
            fill
            className="object-cover"
            unoptimized={previewUrl.startsWith("blob:")}
          />
        </div>
      )}

      {/* File input + button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading…" : previewUrl ? "Change Image" : "Select Image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <span className="text-xs text-ink-soft">JPEG, PNG, or WebP · Max 5 MB</span>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="w-48">
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-clay transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-ink-soft">{progress}% uploaded</p>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-clay-deep">{error}</p>}
    </div>
  );
}
