import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Antibroadcasting Inc. — Minneapolis Screen Printing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        backgroundColor: "#0f0d0d",
        padding: "72px 80px",
        position: "relative",
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "#9c002f",
        }}
      />

      {/* Registration mark top-right */}
      <div
        style={{
          position: "absolute",
          top: "48px",
          right: "80px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "3px solid #9c002f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#9c002f",
          }}
        />
      </div>

      {/* Location badge */}
      <div
        style={{
          display: "flex",
          marginBottom: "20px",
          padding: "6px 16px",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "9999px",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "16px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
          }}
        >
          Minneapolis, MN
        </span>
      </div>

      {/* Company name */}
      <div
        style={{
          fontSize: "72px",
          fontWeight: 900,
          color: "#ffffff",
          fontFamily: "sans-serif",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          marginBottom: "20px",
          textTransform: "uppercase",
        }}
      >
        Antibroadcasting
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: "24px",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "sans-serif",
          marginBottom: "48px",
        }}
      >
        Artist-run screen printing · 50pc minimum · 7–10 day turnaround
      </div>

      {/* Bottom rule */}
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "rgba(255,255,255,0.1)",
          marginBottom: "32px",
        }}
      />

      {/* Domain */}
      <div
        style={{
          fontSize: "20px",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "sans-serif",
          letterSpacing: "0.05em",
        }}
      >
        antibroadcasting.com
      </div>
    </div>,
    {
      ...size,
    },
  );
}
