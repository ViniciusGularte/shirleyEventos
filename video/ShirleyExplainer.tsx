import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import { CaptionLayer } from "./CaptionLayer";

export const ShirleyExplainer = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#120c12" }}>
      <Video
        muted
        objectFit="cover"
        src={staticFile("shirley-platform-tour.webm")}
        style={{
          height: 870,
          left: 0,
          position: "absolute",
          top: 0,
          width: 1920
        }}
      />
      <Audio src={staticFile("shirley-narration.mp3")} volume={1} />
      <CaptionLayer />
    </AbsoluteFill>
  );
};
