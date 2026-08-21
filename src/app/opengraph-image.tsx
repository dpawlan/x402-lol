import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "agenticcommerce.lol — the x402 resource leaderboard";
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
          background: "#fdfcf9",
          color: "#1c1917",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
          <span style={{ color: "#f97066", marginRight: 16 }}>≡</span>
          agenticcommerce.lol
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            The x402 resource
            <br />
            leaderboard.
          </div>
          <div style={{ fontSize: 34, color: "#57534e", marginTop: 28 }}>
            Pay $1 USDC via x402 to rank your API, agent, or tool.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#78716c" }}>
          <span>Agents pay. Agents discover.</span>
          <span style={{ color: "#f97066", fontWeight: 700 }}>USDC on Base · x402</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
