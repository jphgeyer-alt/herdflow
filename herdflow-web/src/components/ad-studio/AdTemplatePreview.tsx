import { forwardRef } from "react";

export type AdCreativeFields = {
  template: string;
  imageUrl: string | null;
  headline: string;
  subline: string;
  ctaText: string;
  bgColor: string;
  textColor: string;
  sponsorName: string;
};

type Props = AdCreativeFields & {
  width: number;
  height: number;
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=900&h=700&fit=crop";

/**
 * Renders one of the 4 Ad Studio templates at true pixel dimensions for a
 * given placement — this exact DOM node is what html-to-image captures for
 * "Download PNG", so on-screen scaling must happen on a wrapping element,
 * never on this one (see the `scale` wrapper in the builder page).
 */
export const AdTemplatePreview = forwardRef<HTMLDivElement, Props>(function AdTemplatePreview(
  { template, imageUrl, headline, subline, ctaText, bgColor, textColor, sponsorName, width, height },
  ref,
) {
  const img = imageUrl || PLACEHOLDER_IMG;
  const base: React.CSSProperties = {
    width,
    height,
    position: "relative",
    overflow: "hidden",
    fontFamily: "Arial, Helvetica, sans-serif",
    boxSizing: "border-box",
  };

  if (template === "banner-photo") {
    return (
      <div ref={ref} style={{ ...base, backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.05) 60%)",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: height * 0.06, color: "#fff" }}>
          <p style={{ margin: 0, fontSize: height * 0.09, fontWeight: 900, lineHeight: 1.1 }}>{headline}</p>
          <p style={{ margin: `${height * 0.02}px 0 0`, fontSize: height * 0.05, opacity: 0.9 }}>{subline}</p>
          {ctaText && (
            <span
              style={{
                display: "inline-block",
                marginTop: height * 0.04,
                padding: `${height * 0.02}px ${height * 0.05}px`,
                background: "#2E7D32",
                borderRadius: 6,
                fontSize: height * 0.045,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {ctaText}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (template === "banner-product") {
    return (
      <div ref={ref} style={{ ...base, background: "#ffffff", display: "flex", border: "1px solid #e4ebf5" }}>
        <div style={{ width: width * 0.4, height: "100%", backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ flex: 1, padding: height * 0.08, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ margin: 0, fontSize: height * 0.06, fontWeight: 900, color: "#1B3A6B", textTransform: "uppercase", letterSpacing: 1 }}>
            {sponsorName}
          </p>
          <p style={{ margin: `${height * 0.04}px 0 0`, fontSize: height * 0.11, fontWeight: 900, color: "#1B3A6B", lineHeight: 1.1 }}>
            {headline}
          </p>
          <p style={{ margin: `${height * 0.03}px 0 0`, fontSize: height * 0.05, color: "#5d7497" }}>{subline}</p>
          {ctaText && (
            <span
              style={{
                display: "inline-block",
                marginTop: height * 0.06,
                padding: `${height * 0.025}px ${height * 0.06}px`,
                background: "#A07C3A",
                color: "#fff",
                borderRadius: 6,
                fontSize: height * 0.045,
                fontWeight: 700,
                width: "fit-content",
                textTransform: "uppercase",
              }}
            >
              {ctaText}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (template === "banner-minimal") {
    return (
      <div
        ref={ref}
        style={{
          ...base,
          background: bgColor,
          color: textColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: width * 0.06,
        }}
      >
        <p style={{ margin: 0, fontSize: height * 0.14, fontWeight: 900, lineHeight: 1.1 }}>{headline}</p>
        {subline && <p style={{ margin: `${height * 0.03}px 0 0`, fontSize: height * 0.06, opacity: 0.85 }}>{subline}</p>}
        {ctaText && (
          <p style={{ margin: `${height * 0.05}px 0 0`, fontSize: height * 0.05, fontWeight: 700, textDecoration: "underline" }}>
            {ctaText}
          </p>
        )}
      </div>
    );
  }

  // banner-classic (default)
  return (
    <div
      ref={ref}
      style={{
        ...base,
        background: bgColor,
        color: textColor,
        display: "flex",
        alignItems: "center",
        gap: width * 0.03,
        padding: `0 ${width * 0.04}px`,
      }}
    >
      <div
        style={{
          width: height * 0.6,
          height: height * 0.6,
          flexShrink: 0,
          borderRadius: "50%",
          backgroundImage: `url(${img})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: `${Math.max(2, height * 0.01)}px solid rgba(255,255,255,0.4)`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: height * 0.1, fontWeight: 900, lineHeight: 1.15 }}>{headline}</p>
        <p style={{ margin: `${height * 0.02}px 0 0`, fontSize: height * 0.05, opacity: 0.85 }}>{subline}</p>
      </div>
      {ctaText && (
        <span
          style={{
            flexShrink: 0,
            padding: `${height * 0.04}px ${height * 0.06}px`,
            background: "#2E7D32",
            color: "#fff",
            borderRadius: 8,
            fontSize: height * 0.05,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {ctaText}
        </span>
      )}
    </div>
  );
});
