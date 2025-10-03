// 临时类型定义，解决 @applemusic-like-lyrics/react 的类型问题
declare module "@applemusic-like-lyrics/react" {
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
    lyricLines?: LyricLine[];
    currentTime?: number;
    alignAnchor?: number | "top" | "bottom";
    enableBlur?: boolean;
    enableSpring?: boolean;
    style?: React.CSSProperties;
  }

  export interface BackgroundRenderProps {
    albumImageUrl?: string;
    playing?: boolean;
    fps?: number;
    flowSpeed?: number;
    renderScale?: number;
    style?: React.CSSProperties;
  }

  export const LyricPlayer: React.FC<LyricPlayerProps>;
  export const BackgroundRender: React.FC<BackgroundRenderProps>;
}