// 临时类型定义，解决 @applemusic-like-lyrics/react 的类型问题
declare module "@applemusic-like-lyrics/react" {
  import type { CSSProperties, FC } from "react";

  export interface LyricLine {
    startTime: number;
    endTime: number;
    words: Array<{
      startTime: number;
      endTime: number;
      word: string;
    }>;
    translatedLyric?: string;
    romanLyric?: string;
    isBG?: boolean;
    isDuet?: boolean;
  }

  export interface LyricPlayerProps {
    disabled?: boolean;
    playing?: boolean;
    lyricLines?: LyricLine[];
    currentTime?: number;
    alignAnchor?: "top" | "bottom" | "center";
    alignPosition?: number;
    enableBlur?: boolean;
    enableSpring?: boolean;
    enableScale?: boolean;
    hidePassedLines?: boolean;
    style?: CSSProperties;
  }

  export interface BackgroundRenderProps {
    album?: string | HTMLImageElement | HTMLVideoElement;
    albumIsVideo?: boolean;
    playing?: boolean;
    fps?: number;
    flowSpeed?: number;
    hasLyric?: boolean;
    lowFreqVolume?: number;
    renderScale?: number;
    staticMode?: boolean;
    renderer?: { new (canvas: HTMLCanvasElement): unknown };
    style?: CSSProperties;
  }

  export const LyricPlayer: FC<LyricPlayerProps>;
  export const BackgroundRender: FC<BackgroundRenderProps>;
}