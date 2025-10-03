import { IParsedLrcItem } from "@/renderer/utils/lyric-parser";
import { LyricLine } from "@applemusic-like-lyrics/react";

/**
 * 将MusicFree的歌词格式转换为AMLL组件需要的格式
 */
export function convertToAMLLFormat(lrcItems: IParsedLrcItem[]): LyricLine[] {
  if (!lrcItems || lrcItems.length === 0) {
    return [];
  }

  return lrcItems.map((item, index) => {
    const nextItem = lrcItems[index + 1];
    const endTime = nextItem ? nextItem.time * 1000 : (item.time + 5) * 1000; // 如果没有下一行，默认持续5秒
    
    return {
      startTime: item.time * 1000, // 转换为毫秒
      endTime: endTime,
      words: [
        {
          startTime: item.time * 1000,
          endTime: endTime,
          word: item.lrc || "",
        }
      ],
      translatedLyric: item.translation || undefined,
    };
  });
}