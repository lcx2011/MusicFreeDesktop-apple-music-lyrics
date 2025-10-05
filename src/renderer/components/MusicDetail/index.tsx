import AnimatedDiv from "../AnimatedDiv";
import "./index.scss";
import { useLyric, useProgress, useTrackPlayerControls, useRepeatMode, useVolume , useCurrentMusic } from "@renderer/core/track-player/hooks";
import { useCallback, useEffect, useMemo } from "react";
import { musicDetailShownStore } from "@renderer/components/MusicDetail/store";
import { LyricPlayer, BackgroundRender, EplorRenderer } from "@applemusic-like-lyrics/react";
import { convertToAMLLFormat } from "./utils/lyric-converter";
import Header from "./widgets/Header";
import albumImg from "@/assets/imgs/album-cover.jpg";
import trackPlayer from "@renderer/core/track-player";
import { RepeatMode } from "@/common/constant";
import PlayIcon from "../../../../res/player/开始.svg";
import PauseIcon from "../../../../res/player/暂停.svg";
import NextIcon from "../../../../res/player/下.svg";
import PreviousIcon from "../../../../res/player/上.svg";
import ElasticSlider from "./ElasticSlider"
import SvgAsset from "@/renderer/components/SvgAsset";
export const isMusicDetailShown = musicDetailShownStore.getValue;
export const useMusicDetailShown = musicDetailShownStore.useValue;

function MusicDetail() {
  const musicDetailShown = musicDetailShownStore.useValue();
  const lyricContext = useLyric();
  const { currentTime, duration } = useProgress();
  const repeatMode = useRepeatMode();
  const volume = useVolume();
  const { togglePlay, next, previous, seek, setVolume, isPlaying } = useTrackPlayerControls();
  const musicItem = useCurrentMusic();
  const lyricLines = useMemo(() => {
    const lyricItems = lyricContext?.parser?.getLyricItems?.() ?? [];
    return convertToAMLLFormat(lyricItems);
  }, [lyricContext?.parser]);
  const currentTimeMs = useMemo(() => currentTime * 1000, [currentTime]);
  const albumUrl = useMemo(() => musicItem?.artwork ?? albumImg, [musicItem?.artwork]);

  const formatTime = useCallback((sec?: number) => {
    if (sec === undefined || sec === null || !isFinite(sec)) return "--:--";
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }, []);

  // 原生 input 已被 ElasticSlider 替代，保留的回调已移除

  const setShuffle = useCallback(() => {
    trackPlayer.setRepeatMode(RepeatMode.Shuffle);
  }, []);

  const setLoop = useCallback(() => {
    trackPlayer.setRepeatMode(RepeatMode.Loop);
  }, []);

  useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      if (evt.code === "Escape" && musicDetailShown) {
        evt.preventDefault();
        musicDetailShownStore.setValue(false);
      }

      if ((evt.code === "Space" || evt.code === "Enter") && musicDetailShown) {
        evt.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [musicDetailShown, togglePlay]);
  return (
    <AnimatedDiv
      showIf={musicDetailShown}
      className="music-detail--container animate__animated background-color"
      mountClassName="animate__slideInUp"
      unmountClassName="animate__slideOutDown"
      onAnimationEnd={() => {
        setTimeout(() => {
          document.body.style.width = "0";
          document.body.getBoundingClientRect();
          document.body.style.width = "";
        }, 200);
      }}
    >
      <div className="music-detail--header">
        <Header></Header>
      </div>

      {/* Background as visual layer behind content */}
      <div className="amll-bg">
        <BackgroundRender album={albumUrl} renderer={EplorRenderer}/>
      </div>
      <div className="main">
        <div className="left">
            <div className="music-album">
              <img src={albumUrl} alt="cover" />
            </div>
          {/* Controls under album */}
          <div className="album-controls">
            {/* Row 1: title + menu */}
            <div className="row title-row">
              <div className="title" title={musicItem?.title || ""}>{musicItem?.title || ""}</div>
              <button className="menu-btn" aria-label="more" onClick={() => { /* TODO: open menu */ }}>
                ⋯   
              </button>
            </div>

            {/* Row 2: progress */}
            <div className="row progress-row">
              <ElasticSlider
                className="progress"
                leftIcon={<></>}
                rightIcon={<></>}
                startingValue={0}
                defaultValue={isFinite(duration) ? Math.min(Math.max(0, currentTime), Math.max(0, duration)) : 0}
                maxValue={isFinite(duration) ? Math.max(0, duration) : 0}
                showValueIndicator={false}
                onChange={(val) => seek(val)}
              />
            </div>
            {/* Row 2.1: times under progress */}
            <div className="row time-row">
              <span className="time current">{formatTime(currentTime)}</span>
              <span className="time duration">{formatTime(isFinite(duration) ? duration : undefined)}</span>
            </div>

            {/* Row 3: controls */}
            <div className="row controls-row">
              <button
                className="ctrl shuffle"
                data-active={repeatMode === RepeatMode.Shuffle}
                title="Shuffle"
                onClick={setShuffle}
              >
                <SvgAsset iconName="shuffle" size={30} title="Shuffle" color="white" />
              </button>
              <button className="ctrl prev" title="Previous" onClick={previous}>
                  <PreviousIcon title="上一首" style={{ width: "30px", height: "30px", color: "white" }}/>
              </button>
              <button className="ctrl play" title={isPlaying ? "Pause" : "Play"} onClick={togglePlay}>
              {isPlaying ? <PlayIcon title="开始" style={{ width: "30px", height: "30px", color: "white" }}/> : <PauseIcon title="暂停" style={{ width: "30px", height: "30px", color: "white" }}/>}
              </button>
              <button className="ctrl next" title="Next" onClick={next}>
                  <NextIcon title="下一首" style={{ width: "30px", height: "30px", color: "white" }}/>
              </button>
              <button
                className="ctrl loop"
                data-active={repeatMode === RepeatMode.Loop}
                title="Loop"
                onClick={setLoop}
              >
                <SvgAsset iconName="repeat-song" size={30} title="Loop" color="white" />
              </button>
            </div>

            {/* Row 4: volume */}
            <div className="row volume-row">
              <ElasticSlider
                className="volume"
                startingValue={0}
                defaultValue={typeof volume === "number" ? Math.min(Math.max(0, volume * 100), 100) : 0}
                maxValue={100}
                showValueIndicator={false}

                onChange={(val) => setVolume(val/100)}
              />
            </div>
          </div>

        </div>
        <div className="music-lyric-only">
          <LyricPlayer
            lyricLines={lyricLines}
            currentTime={currentTimeMs+500}
            alignPosition={0.3}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
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