import { useTranslation } from "react-i18next";
import type { KeyboardEvent } from "react";
import React from "react";
import SvgAsset from "@/renderer/components/SvgAsset";
import { setFallbackAlbum } from "@/renderer/utils/img-on-error";
import "./index.scss";

interface ISongCardGridProps {
  musicList: IMusic.IMusicItem[];
  className?: string;
  onItemClick?: (item: IMusic.IMusicItem) => void;
  onItemContextMenu?: (
    item: IMusic.IMusicItem,
    event: React.MouseEvent<HTMLDivElement>
  ) => void;
  showArtistInline?: boolean;
}

export default function SongCardGrid(props: ISongCardGridProps) {
  const {
    musicList = [],
    className,
    onItemClick,
    onItemContextMenu,
    showArtistInline = true,
  } = props;

  const { t } = useTranslation();

  const handleKeyDown = (
    evt: KeyboardEvent<HTMLDivElement>,
    item: IMusic.IMusicItem
  ) => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      onItemClick?.(item);
    }
  };

  const containerClassName = className
    ? `song-card-grid ${className}`
    : "song-card-grid";

  return (
    <div className={containerClassName}>
      {musicList.map((item, index) => {
        const title = item?.title || t("media.unknown_title");
        const artist = item?.artist;
        const tooltip = artist ? `${title} - ${artist}` : title;
        const uniqueKey =
          item?.platform && item?.id
            ? `${item.platform}_${item.id}`
            : `song-card_${index}`;

        return (
          <div
            className="song-card-grid__item"
            key={uniqueKey}
            role="button"
            tabIndex={0}
            title={tooltip}
            onClick={() => {
              onItemClick?.(item);
            }}
            onKeyDown={(evt) => handleKeyDown(evt, item)}
            onContextMenu={(evt) => {
              evt.preventDefault();
              onItemContextMenu?.(item, evt);
            }}
          >
            <div className="song-card-grid__cover">
              {item?.artwork ? (
                <img
                  src={item.artwork}
                  alt={title}
                  onError={setFallbackAlbum}
                ></img>
              ) : (
                <SvgAsset iconName="musical-note"></SvgAsset>
              )}
            </div>
            {showArtistInline && artist ? (
              <div className="song-card-grid__meta song-card-grid__meta--inline">
                <span className="song-card-grid__title--inline">{title}</span>
                <span className="song-card-grid__separator">·</span>
                <span className="song-card-grid__artist">{artist}</span>
              </div>
            ) : (
              <div className="song-card-grid__title" title={title}>
                {title}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
