import { useCallback, useEffect, useRef, useState } from "react";
import "./index.scss";
import trackPlayer from "@renderer/core/track-player";
import {useProgress} from "@renderer/core/track-player/hooks";

export default function Slider() {
  const [seekPercent, _setSeekPercent] = useState<number | null>(null);
  const seekPercentRef = useRef<number | null>(null);
  const { currentTime, duration } = useProgress();
  const isPressedRef = useRef(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  function setSeekPercent(value: number | null) {
    _setSeekPercent(value);
    seekPercentRef.current = value;
  }

  const getPercent = useCallback((clientX: number) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) {
      return null;
    }
    const percent = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, percent));
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isPressedRef.current) {
        const percent = getPercent(e.clientX);
        if (percent !== null) {
          setSeekPercent(percent);
        }
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (isPressedRef.current) {
        isPressedRef.current = false;
        const percent = getPercent(e.clientX) ?? seekPercentRef.current;
        const targetDuration = isFinite(duration) && duration
          ? duration
          : trackPlayer.progress.duration;
        if (percent !== null && targetDuration) {
          trackPlayer.seekTo(targetDuration * percent);
        }
        setSeekPercent(null);
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [duration, getPercent]);
  return (
    <div
      className="music-bar--slider-container"
      ref={sliderRef}
      onMouseDown={(e) => {
        if (isFinite(duration) && duration) {
          isPressedRef.current = true;
          const percent = getPercent(e.clientX);
          if (percent !== null) {
            setSeekPercent(percent);
          }
        }
      }}
      onClick={(e) => {
        if (isFinite(duration) && duration) {
          const percent = getPercent(e.clientX);
          if (percent !== null) {
            trackPlayer.seekTo(duration * percent);
          }
        }
      }}
    >
      <div className="bar"></div>
      <div
        className="active-bar"
        style={{
          transform: `translateX(${
            seekPercent !== null
              ? seekPercent * 100
              : duration === 0
              ? 0
              : !isFinite(duration) || isNaN(duration)
              ? 0
              : (currentTime / duration) * 100
          }%)`,
        }}
      ></div>
    </div>
  );
}
