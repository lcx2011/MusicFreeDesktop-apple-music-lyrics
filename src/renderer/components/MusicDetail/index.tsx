import AnimatedDiv from "../AnimatedDiv";
import "./index.scss";
import albumImg from "@/assets/imgs/album-cover.jpg";
import Tag from "../Tag";
import {setFallbackAlbum} from "@/renderer/utils/img-on-error";
import Header from "./widgets/Header";
import Condition from "../Condition";
import {useTranslation} from "react-i18next";
import {
  useCurrentMusic,
  useLyric,
  usePlayerState,
  useProgress,
} from "@renderer/core/track-player/hooks";
import {useEffect, useMemo} from "react";
import {musicDetailShownStore} from "@renderer/components/MusicDetail/store";
import {LyricPlayer, BackgroundRender, type LyricLine} from "@applemusic-like-lyrics/react";
import{PrebuiltLyricPlayer} from "@applemusic-like-lyrics/react-full";
import {PlayerState} from "@/common/constant";
import { EplorRenderer } from '@applemusic-like-lyrics/core';
export const isMusicDetailShown = musicDetailShownStore.getValue;
export const useMusicDetailShown = musicDetailShownStore.useValue;

function MusicDetail() {
  
  const musicItem = useCurrentMusic();
  const musicDetailShown = musicDetailShownStore.useValue();
  const lyricContext = useLyric();
  const progress = useProgress();
  const playerState = usePlayerState();

  const { t } = useTranslation();

  useEffect(() => {
    const escHandler = (evt: KeyboardEvent) => {
      if (evt.code === "Escape") {
        evt.preventDefault();
        musicDetailShownStore.setValue(false);
      }
    };
    window.addEventListener("keydown", escHandler);
    return () => {
      window.removeEventListener("keydown", escHandler);
    }
  }, []);

  const albumImageUrl = musicItem?.artwork ?? albumImg;
  const isPlaying = playerState === PlayerState.Playing;
  const currentTimeMs = Math.max(0, Math.floor((progress?.currentTime ?? 0) * 1000));

  const lyricLines: LyricLine[] = useMemo(() => {
    const parser = lyricContext?.parser;
    if (!parser?.getLyricItems) {
      return [];
    }

    const items = parser.getLyricItems() ?? [];
    if (!items.length) {
      return [];
    }

    return items.map((item, index) => {
      const next = items[index + 1];
      const startTime = Math.max(0, Math.floor(item.time * 1000));
      const endTime = next
        ? Math.max(startTime + 1, Math.floor(next.time * 1000))
        : startTime + 4000;

      return {
        startTime,
        endTime,
        words: [
          {
            startTime,
            endTime,
            word: item.lrc || "\u00A0",
          },
        ],
        translatedLyric: item.translation ?? "",
        romanLyric: "",
      } satisfies LyricLine;
    });
  }, [lyricContext?.parser]);
console.log(lyricLines);
  return (
    <AnimatedDiv
      showIf={musicDetailShown}
      className="music-detail--container animate__animated background-color"
      mountClassName="animate__slideInUp"
      unmountClassName="animate__slideOutDown"
      onAnimationEnd={() => {
        // hack logic: https://github.com/electron/electron/issues/32341
        // force reflow to refresh drag region
        setTimeout(() => {
          document.body.style.width = "0";
          document.body.getBoundingClientRect();
          document.body.style.width = "";
        }, 200);
      }}
    >
      <div className="music-detail--background">
        <BackgroundRender
          album={albumImageUrl}
          renderer={EplorRenderer}
          style={{ width: "100%", height: "100%" }}
        />
        <div className="music-detail--background-overlay" />
      </div>
      <Header></Header>
      <div className="music-detail--content">
        <div className="music-detail--left">
          <div
            className={`music-detail--album ${isPlaying ? "playing" : ""}`}
            title={musicItem?.title}
          >
            <img
              onError={setFallbackAlbum}
              src={albumImageUrl}
              alt={musicItem?.title ?? "album"}
            />
          </div>
          <div className="music-title" title={musicItem?.title}>
            {musicItem?.title || t("media.unknown_title")}
          </div>
          <div className="music-info">
            <span>
              <Condition condition={musicItem?.artist}>
                {musicItem?.artist}
              </Condition>
              <Condition condition={musicItem?.album}>
                {" "}
                - {musicItem?.album}
              </Condition>
            </span>
            {musicItem?.platform ? <Tag fill>{musicItem.platform}</Tag> : null}
          </div>
        </div>
        <div className="music-detail--center">
          <div className="music-detail--lyric">
            {lyricLines.length > 0 ? (
              
              <PrebuiltLyricPlayer
                lyricLines={lyricLines}
                currentTime={currentTimeMs+500}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="music-detail--lyric-empty">
                {lyricContext === null
                  ? t("music_detail.loading_lyric")
                  : t("music_detail.no_lyric")}
              </div>
            )}
          </div>
        </div>
        <div className="music-detail--right" />
      </div>
    </AnimatedDiv>
  );
}

MusicDetail.show = () => {
  musicDetailShownStore.setValue(true);
}

MusicDetail.hide = () => {
  musicDetailShownStore.setValue(false);
}

export default MusicDetail;
