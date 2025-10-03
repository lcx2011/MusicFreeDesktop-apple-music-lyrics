import { RequestStateCode } from "@/common/constant";
import Condition from "@/renderer/components/Condition";
import Empty from "@/renderer/components/Empty";
import Loading from "@/renderer/components/Loading";
import SvgAsset from "@/renderer/components/SvgAsset";
import trackPlayer from "@/renderer/core/track-player";
import { showModal } from "@/renderer/components/Modal";
import { showMusicContextMenu } from "@/renderer/components/MusicList";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import "./favorite-sheet.scss";

interface IProps {
  musicSheet: IMusic.IMusicSheetItem;
  musicList: IMusic.IMusicItem[];
  state?: RequestStateCode;
}

export default function FavoriteSheet(props: IProps) {
  const { musicSheet, musicList = [], state = RequestStateCode.IDLE } = props;
  const { t } = useTranslation();

  const totalDuration = useMemo(() => {
    const totalSeconds = musicList.reduce(
      (acc, item) => acc + (item?.duration ?? 0),
      0
    );
    if (!totalSeconds) {
      return null;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [musicList]);

  const onPlayAll = () => {
    if (!musicList.length) {
      return;
    }
    trackPlayer.playMusicWithReplaceQueue(musicList);
  };

  const onAddToSheet = () => {
    if (!musicList.length) {
      return;
    }
    showModal("AddMusicToSheet", {
      musicItems: musicList,
    });
  };

  const summaryText = [
    musicList.length
      ? `共 ${musicList.length} 首歌曲`
      : t("common.none"),
    totalDuration ? `总时长 ${totalDuration}` : null,
  ].filter(Boolean);

  return (
    <div className="favorite-sheet-container">
      <div className="favorite-sheet-toolbar">
        <div className="favorite-sheet-toolbar__actions">
          <button
            className="favorite-sheet-toolbar__btn"
            type="button"
            disabled={!musicList.length}
            onClick={onPlayAll}
            title={t("music_sheet_like_view.play_all")}
          >
            <SvgAsset iconName="play"></SvgAsset>
            <span>{t("music_sheet_like_view.play_all")}</span>
          </button>
          <button
            className="favorite-sheet-toolbar__btn"
            type="button"
            disabled={!musicList.length}
            onClick={onAddToSheet}
            title={t("music_sheet_like_view.add_to_sheet")}
          >
            <SvgAsset iconName="plus"></SvgAsset>
            <span>{t("music_sheet_like_view.add_to_sheet")}</span>
          </button>
        </div>
        <div className="favorite-sheet-toolbar__summary">
          {summaryText.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <Condition
        condition={state !== RequestStateCode.PENDING_FIRST_PAGE}
        falsy={<Loading></Loading>}
      >
        <Condition
          condition={musicList.length > 0}
          falsy={<Empty></Empty>}
        >
          <div className="favorite-sheet-grid">
            {musicList.map((item) => {
              const uniqueKey = `${item.platform}_${item.id}`;
              const title = item.title || t("media.unknown_title");
              return (
                <div
                  className="favorite-sheet-grid__item"
                  key={uniqueKey}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    trackPlayer.playMusic(item);
                  }}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter" || evt.key === " ") {
                      evt.preventDefault();
                      trackPlayer.playMusic(item);
                    }
                  }}
                  onContextMenu={(evt) => {
                    evt.preventDefault();
                    showMusicContextMenu(item, evt.clientX, evt.clientY, musicSheet?.id);
                  }}
                  title={title}
                >
                  <div className="favorite-sheet-grid__item-cover">
                    {item.artwork ? (
                      <img src={item.artwork} alt={title}></img>
                    ) : (
                      <SvgAsset iconName="musical-note"></SvgAsset>
                    )}
                  </div>
                  <div className="favorite-sheet-grid__item-title">{title}</div>
                </div>
              );
            })}
          </div>
        </Condition>
      </Condition>
    </div>
  );
}
