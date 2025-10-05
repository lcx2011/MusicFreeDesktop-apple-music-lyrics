import MusicInfo from "./widgets/MusicInfo";
import Controller from "./widgets/Controller";
import {useEffect, useMemo, useState} from "react";
import {Slider} from "@heroui/react";
import {useProgress} from "@renderer/core/track-player/hooks";
import {musicDetailShownStore} from "@renderer/components/MusicDetail/store";
import trackPlayer from "@renderer/core/track-player";

import "./index.scss";

export default function MusicBar() {
  const musicDetailShown = musicDetailShownStore.useValue();
  const {currentTime, duration} = useProgress();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPercent, setSeekPercent] = useState(0);

  const progressPercent = useMemo(() => {
    if (!duration || !isFinite(duration) || duration <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  useEffect(() => {
    if (!isSeeking) {
      setSeekPercent(progressPercent);
    }
  }, [progressPercent, isSeeking]);

  const handleSliderChange = (value: number | number[]) => {
    const next = Array.isArray(value) ? value[0] ?? 0 : value ?? 0;
    setIsSeeking(true);
    setSeekPercent(next);
  };

  const handleSliderChangeEnd = (value: number | number[]) => {
    const next = Array.isArray(value) ? value[0] ?? 0 : value ?? 0;
    setIsSeeking(false);
    if (duration && isFinite(duration) && duration > 0) {
      trackPlayer.seekTo((next / 100) * duration);
    }
  };

  if (musicDetailShown) {
    return null;
  }

  return (
    <div className="music-bar-wrapper">
      <div className="music-bar-container background-color">
        <MusicInfo></MusicInfo>
        <div className="music-bar-progress">
          <Slider
            aria-label="Player progress"
            color="primary"
            value={seekPercent}
            onChange={handleSliderChange}
            onChangeEnd={handleSliderChangeEnd}
            hideThumb={false}
            minValue={0}
            maxValue={100}
            classNames={{
              base: "music-bar-progress-slider",
              track: "music-bar-progress-track",
              filler: "music-bar-progress-filler",
            }}
          />
        </div>
        <Controller></Controller>
      </div>
    </div>
  );
}
