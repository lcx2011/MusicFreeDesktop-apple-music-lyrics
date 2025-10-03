import "./index.scss";
import SvgAsset from "@/renderer/components/SvgAsset";
import SongCardGrid from "@/renderer/components/SongCardGrid";
import Condition from "@/renderer/components/Condition";
import Empty from "@/renderer/components/Empty";
import trackPlayer from "@/renderer/core/track-player";
import { showMusicContextMenu } from "@/renderer/components/MusicList";
import {
  clearRecentlyPlaylist,
  useRecentlyPlaylistSheet,
} from "@/renderer/core/recently-playlist";
import { useTranslation } from "react-i18next";

export default function RecentlyPlayView() {
  const recentlyPlaylistSheet = useRecentlyPlaylistSheet();
  const { t } = useTranslation();

  const musicList = recentlyPlaylistSheet?.musicList ?? [];
  const songCountText = musicList.length
    ? `共 ${musicList.length} 首歌曲`
    : t("common.none");

  return (
    <div id="page-container" className="page-container recently-play-view">
      <div className="recently-play-view__header">
        <div className="recently-play-view__headline">
          <span className="recently-play-view__title">
            {recentlyPlaylistSheet?.title ?? t("side_bar.recently_play")}
          </span>
          <span className="recently-play-view__count">{songCountText}</span>
        </div>
        <button
          type="button"
          className="recently-play-view__clear"
          disabled={!musicList.length}
          onClick={() => {
            if (!musicList.length) {
              return;
            }
            clearRecentlyPlaylist();
          }}
        >
          <SvgAsset iconName={"trash"}></SvgAsset>
          <span>{t("common.clear")}</span>
        </button>
      </div>

      <Condition
        condition={musicList.length}
        falsy={
          <Empty
            style={{
              minHeight: "220px",
            }}
          ></Empty>
        }
      >
        <SongCardGrid
          className="recently-play-view__grid"
          musicList={musicList}
          showArtistInline={false}
          onItemClick={(item) => {
            trackPlayer.playMusic(item);
          }}
          onItemContextMenu={(item, evt) => {
            showMusicContextMenu(item, evt.clientX, evt.clientY);
          }}
        ></SongCardGrid>
      </Condition>
    </div>
  );
}
