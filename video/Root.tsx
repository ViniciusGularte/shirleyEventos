import { Composition } from "remotion";
import { ShirleyExplainer } from "./ShirleyExplainer";
import videoMetadata from "./video-metadata.json";

export const VIDEO_FPS = 30;
export const VIDEO_DURATION_SECONDS = videoMetadata.durationSeconds;

export const RemotionRoot = () => {
  return (
    <Composition
      id="ShirleyExplainer"
      component={ShirleyExplainer}
      durationInFrames={VIDEO_DURATION_SECONDS * VIDEO_FPS}
      fps={VIDEO_FPS}
      width={1920}
      height={1080}
    />
  );
};
