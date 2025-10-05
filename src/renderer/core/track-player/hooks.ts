import {useCallback, useMemo} from "react";
import _trackPlayerStore from "@renderer/core/track-player/store";
import trackPlayer from "@renderer/core/track-player";
import {PlayerState} from "@/common/constant";

const {
    musicQueueStore,
    currentMusicStore,
    currentLyricStore,
    repeatModeStore,
    progressStore,
    playerStateStore,
    currentVolumeStore,
    currentSpeedStore,
    currentQualityStore,
} = _trackPlayerStore;

export const useCurrentMusic = currentMusicStore.useValue;

export const useProgress = progressStore.useValue;

export const usePlayerState = playerStateStore.useValue;

export const useRepeatMode = repeatModeStore.useValue;

export const useMusicQueue = musicQueueStore.useValue;

export const useLyric = currentLyricStore.useValue;

export const useVolume = currentVolumeStore.useValue;

export const useSpeed = currentSpeedStore.useValue;

export const useQuality = currentQualityStore.useValue;

export function useTrackPlayerControls() {
    const playerState = usePlayerState();

    const play = useCallback(() => {
        trackPlayer.resume();
    }, []);

    const pause = useCallback(() => {
        trackPlayer.pause();
    }, []);

    const togglePlay = useCallback(() => {
        if (playerState === PlayerState.Playing) {
            trackPlayer.pause();
        } else {
            trackPlayer.resume();
        }
    }, [playerState]);

    const next = useCallback(() => {
        trackPlayer.skipToNext();
    }, []);

    const previous = useCallback(() => {
        trackPlayer.skipToPrev();
    }, []);

    const seek = useCallback((seconds: number) => {
        trackPlayer.seekTo(seconds);
    }, []);

    const setVolume = useCallback((volume: number) => {
        trackPlayer.setVolume(volume);
    }, []);

    const setSpeed = useCallback((speed: number) => {
        trackPlayer.setSpeed(speed);
    }, []);

    return useMemo(() => ({
        playerState,
        isPlaying: playerState === PlayerState.Playing,
        play,
        pause,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        setSpeed,
    }), [
        pause,
        play,
        playerState,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        setSpeed,
    ]);
}
