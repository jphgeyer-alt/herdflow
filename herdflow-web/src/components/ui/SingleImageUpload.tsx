"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.88;

function compressToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight, 1));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

interface SingleImageUploadProps {
  label?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspectRatio?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export function SingleImageUpload({
  label,
  value,
  onChange,
  aspectRatio = "16/9",
  placeholder = "Upload image",
  required,
  hint,
}: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const isValid =
    value && (value.startsWith("data:image/") || value.startsWith("http") || value.startsWith("/"));

  async function processFile(file: File) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, WebP images accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be smaller than 10MB.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const url = await compressToBase64(file);
      onChange(url);
    } catch {
      setError("Failed to process image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-[#244367]">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div
        className="relative w-full overflow-hidden rounded-xl border-2 border-[#e4ebf5] transition"
        style={{ aspectRatio }}
      >
        {isValid ? (
          /* Preview */
          <div className="group relative h-full w-full" style={{ aspectRatio }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value!} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg"
                title="Remove image"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Drop zone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) processFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 transition ${
              dragOver ? "bg-[#f0f5ff]" : "bg-[#f5f8fd] hover:bg-[#eef3fb]"
            } border-2 border-dashed ${error ? "border-red-400" : dragOver ? "border-[#1B3A6B]" : "border-[#cdd8e7] hover:border-[#1B3A6B]"} rounded-xl`}
            style={{ aspectRatio }}
          >
            {uploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B3A6B] border-t-transparent" />
            ) : (
              <>
                <Upload size={24} className="text-[#9aabb9]" />
                <p className="text-sm font-medium text-[#5d7497]">{placeholder}</p>
                <p className="text-xs text-[#9aabb9]">Drag & drop or click to browse</p>
                <p className="text-xs text-[#9aabb9]">JPEG, PNG, WebP · Max 10MB</p>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) processFile(f);
        }}
      />

      {hint && !error && <p className="text-xs text-[#9aabb9]">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
