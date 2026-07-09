"use client";

import { useEffect, useRef } from "react";

const FALLBACK =
  "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop";

interface SafeImgProps {
  src: string;
  alt: string;
  className?: string;
}

function isValidSrc(src: string): boolean {
  if (!src) return false;
  return (
    src.startsWith("data:image/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  );
}

/**
 * Renders an <img> that always shows a cattle farm fallback when the src
 * fails — including images that break before React hydrates (race condition).
 */
export function SafeImg({ src, alt, className }: SafeImgProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const resolvedSrc = isValidSrc(src) ? src : FALLBACK;

  // Handle the hydration race: if the image already failed before React
  // registered the onError handler, fix it on mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      img.src = FALLBACK;
    }
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== FALLBACK) {
          img.src = FALLBACK;
        }
      }}
    />
  );
}
