import type { Caption } from "@remotion/captions";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "./captions-shirley.json";

const captions = captionsJson satisfies Caption[];

export const CaptionLayer = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;
  const caption = captions.find((item) => currentMs >= item.startMs && currentMs < item.endMs);
  const opacity = caption ? interpolate(currentMs - caption.startMs, [0, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", pointerEvents: "none" }}>
      <div style={{ alignItems: "center", background: "#120c12", borderTop: "6px solid #be185d", display: "flex", height: 210, justifyContent: "center", padding: "0 76px" }}>
        <span style={{ alignItems: "center", background: "#be185d", borderRadius: 99, color: "white", display: "flex", flexShrink: 0, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 20, fontWeight: 900, height: 54, justifyContent: "center", marginRight: 28, width: 54 }}>CC</span>
        <p style={{ color: "#fff8fb", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 40, fontWeight: 800, lineHeight: 1.22, margin: 0, maxWidth: 1580, opacity, textAlign: "center" }}>{caption?.text ?? ""}</p>
      </div>
    </AbsoluteFill>
  );
};
