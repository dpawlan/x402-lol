import { ImageResponse } from "next/og";

export const alt = "AgenticCommerce.lol — the x402 resource leaderboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0c0a09",
          color: "#fafaf9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 18, height: 34, background: "#f97066", borderRadius: 4, marginRight: 18 }} />
          <div style={{ display: "flex" }}>AgenticCommerce.lol</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            The x402 resource
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            leaderboard.
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#a8a29e", marginTop: 28 }}>
            Pay $1 USDC via x402 to rank your API, agent, or tool.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#78716c" }}>
          <div style={{ display: "flex" }}>Agents pay. Agents discover.</div>
          <div style={{ display: "flex", color: "#f97066", fontWeight: 700 }}>USDC on Base · x402</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
