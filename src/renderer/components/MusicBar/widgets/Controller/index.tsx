import SkipPrevIcon from "../../../../../../res/player/上.svg";
import PlayIcon from "../../../../../../res/player/开始.svg";
import PauseIcon from "../../../../../../res/player/暂停.svg";
import SkipNextIcon from "../../../../../../res/player/下.svg";
import "./index.scss";
import trackPlayer from "@renderer/core/track-player";
import { useTranslation } from "react-i18next";
import classNames from "@/renderer/utils/classnames";
import { PlayerState, RepeatMode } from "@/common/constant";
import {usePlayerState, useRepeatMode} from "@renderer/core/track-player/hooks";
import SvgAsset from "@/renderer/components/SvgAsset";

export default function Controller() {
  const playerState = usePlayerState();
  const repeatMode = useRepeatMode();
  const {t} = useTranslation();

  const handlePlayPause = () => {
    if (playerState === PlayerState.Playing) {
      trackPlayer.pause();
    } else {
      trackPlayer.resume();
    }
  };

  const handleNext = () => {
    trackPlayer.skipToNext();
  };

  const handlePrev = () => {
    trackPlayer.skipToPrev();
  };

  const handleLoop = () => {
    trackPlayer.setRepeatMode(
      repeatMode === RepeatMode.Loop ? RepeatMode.Queue : RepeatMode.Loop
    );
  };

  const handleShuffle = () => {
    trackPlayer.setRepeatMode(
      repeatMode === RepeatMode.Shuffle ? RepeatMode.Queue : RepeatMode.Shuffle
    );
  };

  return (
    <div className="music-controller">
      <div
        className={classNames({
          "controller-btn": true,
          "controller-btn--shuffle": true,
          highlight: repeatMode === RepeatMode.Shuffle,
        })}
        title={t("media.music_repeat_mode_shuffle")}
        onClick={handleShuffle}
      >
        <SvgAsset iconName="shuffle" />
      </div>
      <div
        className="controller-btn controller-btn--prev"
        title={t("music_bar.previous_music")}
        onClick={handlePrev}
      >
        <SkipPrevIcon />
      </div>
      <div
        className="controller-btn controller-btn--play"
        title={
          playerState === PlayerState.Playing
            ? t("music_bar.pause_music")
            : t("music_bar.play_music")
        }
        onClick={handlePlayPause}
      >
        {playerState === PlayerState.Playing ? <PlayIcon /> : <PauseIcon />}
      </div>
      <div
        className="controller-btn controller-btn--next"
        title={t("music_bar.next_music")}
        onClick={handleNext}
      >
        <SkipNextIcon />
      </div>
      <div
        className={classNames({
          "controller-btn": true,
          "controller-btn--loop": true,
          highlight: repeatMode === RepeatMode.Loop,
        })}
        title={
          repeatMode === RepeatMode.Loop
            ? t("media.music_repeat_mode_loop")
            : t("media.music_repeat_mode_queue")
        }
        onClick={handleLoop}
      >
        <SvgAsset
          iconName={repeatMode === RepeatMode.Loop ? "repeat-song" : "repeat-song-1"}
        />
      </div>
    </div>
  );
}
