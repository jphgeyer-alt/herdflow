"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

const MAX_SIDE = 1200;
const JPEG_QUALITY = 0.85;

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
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

function isValidImage(src: string) {
  return src.startsWith("data:image/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/");
}

interface MultiImageUploadProps {
  label?: string;
  values: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  required?: boolean;
  hint?: string;
}

export function MultiImageUpload({ label, values, onChange, maxImages = 10, required, hint }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function processFiles(files: File[]) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    setError("");
    const toUpload = files.filter((f) => allowed.includes(f.type)).slice(0, maxImages - values.length);
    if (toUpload.length === 0) { setError("Only JPEG, PNG, WebP, GIF images are accepted."); return; }
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of toUpload) {
      try { newUrls.push(await compressToBase64(file)); }
      catch { setError("Failed to process one or more images."); }
    }
    setUploading(false);
    if (newUrls.length) onChange([...values, ...newUrls]);
  }

  function removeImage(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-[#244367]">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Image grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {values.map((src, i) => (
            <div key={i} className={`relative rounded-lg overflow-hidden border-2 ${i === 0 ? "border-[#2E7D32]" : "border-[#e4ebf5]"} group`} style={{ aspectRatio: "4/3" }}>
              {isValidImage(src) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`Lot image ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#f0f5ff] flex items-center justify-center">
                  <ImageIcon size={24} className="text-[#cdd8e7]" />
                </div>
              )}
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-[#2E7D32] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">MAIN</div>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {/* Add more slot */}
          {values.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="border-2 border-dashed border-[#cdd8e7] rounded-lg flex flex-col items-center justify-center text-[#9aabb9] hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition disabled:opacity-50"
              style={{ aspectRatio: "4/3" }}
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={18} />
                  <span className="text-[10px] mt-1 font-semibold">Add</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Drop zone — shown when empty */}
      {values.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            processFiles(Array.from(e.dataTransfer.files));
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
            dragOver ? "border-[#1B3A6B] bg-[#f0f5ff]" : "border-[#cdd8e7] hover:border-[#1B3A6B] hover:bg-[#f8fafd]"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#5d7497]">Processing images…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#9aabb9]">
              <Upload size={28} />
              <p className="text-sm font-semibold">Drag & drop images here</p>
              <p className="text-xs">or click to browse</p>
              <p className="text-xs mt-1">JPEG, PNG, WebP · Up to {maxImages} images · Max 8MB each</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => processFiles(Array.from(e.target.files || []))}
      />

      {/* Count + error */}
      <div className="flex items-center justify-between">
        <p className={`text-xs ${values.length === 0 && required ? "text-amber-600 font-semibold" : "text-[#9aabb9]"}`}>
          {values.length} of {maxImages} images
          {values.length === 0 && required ? " — at least 1 required" : ""}
        </p>
        {values.length > 0 && values.length < maxImages && (
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-[#2E7D32] hover:underline font-semibold">
            + Add more
          </button>
        )}
      </div>

      {hint && <p className="text-xs text-[#9aabb9]">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
