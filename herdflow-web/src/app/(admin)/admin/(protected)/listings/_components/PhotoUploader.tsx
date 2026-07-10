"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

// Images are compressed client-side (canvas, max 900px, JPEG 82%) and stored
// as base64 data URLs directly in the database — no server filesystem needed.
const MAX_SIDE = 900;
const JPEG_QUALITY = 0.82;

function compressToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight, 1));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not available"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        setUploadError("Only JPEG, PNG and WebP are allowed");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Max file size is 10 MB");
        continue;
      }
      try {
        const dataUrl = await compressToDataUrl(file);
        newUrls.push(dataUrl);
      } catch {
        setUploadError("Failed to process image. Please try again.");
      }
    }
    setUploading(false);
    if (newUrls.length > 0) onChange([...photos, ...newUrls]);
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-navy-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-navy-100 text-navy-400 transition hover:border-navy-600 hover:text-navy-600 disabled:opacity-50"
        >
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy-600 border-t-transparent" />
          ) : (
            <>
              <Upload size={20} />
              <span className="mt-1 text-[10px] font-semibold">Upload</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      <p className="text-xs text-navy-300">JPEG, PNG, WebP • Max 10 MB • Auto-compressed &amp; stored permanently</p>
    </div>
  );
}
