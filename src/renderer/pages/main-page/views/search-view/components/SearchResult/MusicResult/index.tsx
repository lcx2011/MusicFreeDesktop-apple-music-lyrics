import React, { memo } from "react";
import { RequestStateCode } from "@/common/constant";
import useSearch from "../../../hooks/useSearch";
import trackPlayer from "@/renderer/core/track-player";
import Condition from "@/renderer/components/Condition";
import Empty from "@/renderer/components/Empty";
import BottomLoadingState from "@/renderer/components/BottomLoadingState";
import { showMusicContextMenu } from "@/renderer/components/MusicList";
import SongCardGrid from "@/renderer/components/SongCardGrid";

interface IMediaResultProps {
  data: IMusic.IMusicItem[];
  state: RequestStateCode;
  pluginHash: string;
}

function MusicResult(props: IMediaResultProps) {
  const { data, state, pluginHash } = props;
  const search = useSearch();

  return (
    <div className="search-result--music-grid">
      <Condition
        condition={data?.length}
        falsy={
          <Empty
            style={{
              minHeight: "220px",
            }}
          ></Empty>
        }
      >
        <SongCardGrid
          musicList={data}
          onItemClick={(item) => {
            trackPlayer.playMusic(item);
          }}
          onItemContextMenu={(item, evt) => {
            showMusicContextMenu(item, evt.clientX, evt.clientY);
          }}
        ></SongCardGrid>
      </Condition>
      <BottomLoadingState
        state={state}
        onLoadMore={() => {
          if (pluginHash) {
            search(undefined, undefined, "music", pluginHash);
          }
        }}
      ></BottomLoadingState>
    </div>
  );
}

export default memo(
  MusicResult,
  (prev, curr) =>
    prev.data === curr.data &&
    prev.state === curr.state &&
    prev.pluginHash === curr.pluginHash
);
