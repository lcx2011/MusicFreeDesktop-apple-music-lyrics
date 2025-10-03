import "./style/index.css";
import "./index.scss";
import Condition from "@/renderer/components/Condition";
import Loading from "@/renderer/components/Loading";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { showCustomContextMenu } from "@/renderer/components/ContextMenu";
import {
  getUserPreference,
  setUserPreference,
  useUserPreference,
} from "@/renderer/utils/user-perference";
import { toast } from "react-toastify";
import { showModal } from "@/renderer/components/Modal";
import SvgAsset from "@/renderer/components/SvgAsset";
import LyricParser from "@/renderer/utils/lyric-parser";
import { getLinkedLyric, unlinkLyric } from "@/renderer/core/link-lyric";
import { getMediaPrimaryKey } from "@/common/media-util";
import { useTranslation } from "react-i18next";
import { useLyric } from "@renderer/core/track-player/hooks";
import trackPlayer from "@renderer/core/track-player";
import { dialogUtil, fsUtil } from "@shared/utils/renderer";

export default function Lyric() {
  const lyricContext = useLyric();
  const lyricParser = lyricContext?.parser;
  const currentLrc = lyricContext?.currentLrc;

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [fontSize, setFontSize] = useState<string | null>(
    getUserPreference("inlineLyricFontSize")
  );

  const [showTranslation, setShowTranslation] =
    useUserPreference("showTranslation");
  const { t } = useTranslation();

  const mountRef = useRef(false);

  const lyricItems = useMemo(() => lyricParser?.getLyricItems?.() ?? [], [
    lyricParser,
  ]);

  const lyricContainerStyle: CSSProperties | undefined = useMemo(() => {
    if (!fontSize) return undefined;
    return {
      fontSize: `${fontSize}px`,
      ["--amll-lp-font-size" as any]: `${fontSize}px`,
    };
  }, [fontSize]);

  const showTranslationEnabled =
    !!showTranslation && (lyricParser?.hasTranslation ?? false);

  const activeIndex = currentLrc?.index ?? -1;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const currentIndex = lyricContext?.currentLrc?.index;
    if (typeof currentIndex === "number" && currentIndex >= 0) {
      const dom = container.querySelector<HTMLDivElement>(
        `#lyric-item-id-${currentIndex}`
      );
      if (dom) {
        const targetTop =
          dom.offsetTop - container.clientHeight * 0.05 + dom.clientHeight / 1.2;
        container.scrollTo({
          behavior: mountRef.current ? "smooth" : "auto",
          top: targetTop,
        });
      }
    }
    mountRef.current = true;
  }, [lyricContext?.currentLrc?.index, lyricItems.length]);

  const handleSearchLyric = () => {
    const currentMusic = trackPlayer.currentMusic;
    showModal("SearchLyric", {
      defaultTitle: currentMusic?.title,
      musicItem: currentMusic,
    });
  };

  const emptyState = (
    <div className="lyric-empty-state">
      <div className="amll-lyric-line">
        <div className="amll-lyric-main">{t("music_detail.no_lyric")}</div>
      </div>
      <div className="lyric-item search-lyric" role="button" onClick={handleSearchLyric}>
        {t("music_detail.search_lyric")}
      </div>
    </div>
  );

  const optionsComponent = (
    <div className="lyric-options-container">
      <div
        className="lyric-option-item"
        role="button"
        title={t("music_detail.translation")}
        data-active={
          !!showTranslation && (lyricParser?.hasTranslation ?? false)
        }
        data-disabled={!lyricParser?.hasTranslation}
        onClick={() => {
          setShowTranslation(!showTranslation);
        }}
      >
        <SvgAsset iconName="language"></SvgAsset>
      </div>
    </div>
  );

  return (
    <div className="lyric-container-outer">
      <div
        className="lyric-container amll-lyric-player dom"
        data-loading={lyricContext === null}
        onContextMenu={(e) => {
          showCustomContextMenu({
            x: e.clientX,
            y: e.clientY,
            width: 200,
            height: 146,
            component: (
              <LyricContextMenu
                setLyricFontSize={setFontSize}
                lyricParser={lyricParser}
              ></LyricContextMenu>
            ),
          });
        }}
        style={lyricContainerStyle}
        ref={containerRef}
      >
        <Condition
          condition={lyricContext !== null}
          falsy={<Loading></Loading>}
        >
          <Condition condition={lyricParser} falsy={emptyState}>
            <div className="amll-lyric-player-static">
              {lyricItems.map((lyricItem, index) => {
                const isActive = currentLrc?.index === index;
                const distanceFromActive =
                  activeIndex >= 0 ? Math.abs(activeIndex - index) : index;
                const isPast = activeIndex >= 0 && index < activeIndex;
                const state = isActive
                  ? "current"
                  : isPast
                  ? "past"
                  : "future";

                const cappedDistance = Math.min(distanceFromActive, 3);
                const blurLevels = [0, 0.6, 1, 2];
                const opacityLevels = [1, 0.88, 0.68, 0.5];
                const scaleLevels = [1, 0.98, 0.98, 0.97];
                const blurAmount = blurLevels[cappedDistance];
                const opacity = opacityLevels[cappedDistance];
                const scale = scaleLevels[cappedDistance];

                const lineStyle: CSSProperties = {
                  opacity,
                  transform: `translateZ(0) scale(${scale.toFixed(3)})`,
                } as CSSProperties;
                (lineStyle as any)["--lyric-blur"] = `${blurAmount}px`;
                (lineStyle as any)["--lyric-distance"] = distanceFromActive;

                return (
                  <div
                    key={index}
                    className="amll-lyric-line"
                    id={`lyric-item-id-${index}`}
                    data-active={isActive}
                    data-state={state}
                    style={lineStyle}
                  >
                    <div className="amll-lyric-main">
                      {lyricItem.lrc || "\u00A0"}
                    </div>
                    {showTranslationEnabled && (
                      <div className="amll-lyric-sub">
                        {lyricItem.translation || "\u00A0"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Condition>
        </Condition>
      </div>
      {optionsComponent}
    </div>
  );
}

interface ILyricContextMenuProps {
  setLyricFontSize: (val: string) => void;
  lyricParser: LyricParser;
}

function LyricContextMenu(props: ILyricContextMenuProps) {
  const { setLyricFontSize, lyricParser } = props;

  const [fontSize, setFontSize] = useState<string | null>(
    getUserPreference("inlineLyricFontSize") ?? "13"
  );
  const [showTranslation, setShowTranslation] =
    useUserPreference("showTranslation");

  const [linkedLyricInfo, setLinkedLyricInfo] = useState<IMedia.IUnique>(null);

  const { t } = useTranslation();

  const currentMusicRef = useRef<IMusic.IMusicItem>(
    trackPlayer.currentMusic ?? ({} as any)
  );

  useEffect(() => {
    if (currentMusicRef.current?.platform) {
      getLinkedLyric(currentMusicRef.current).then((linked) => {
        if (linked) {
          setLinkedLyricInfo(linked);
        }
      });
    }
  }, []);

  function handleFontSize(val: string | number) {
    if (val) {
      const nVal = +val;
      if (8 <= nVal && nVal <= 32) {
        setUserPreference("inlineLyricFontSize", `${val}`);
        setLyricFontSize(`${val}`);
      }
    }
  }

  async function downloadLyric(fileType: "lrc" | "txt") {
    let rawLrc = "";
    if (fileType === "lrc") {
      rawLrc = lyricParser.toString({
        withTimestamp: true,
      });
    } else {
      rawLrc = lyricParser.toString();
    }

    try {
      const result = await dialogUtil.showSaveDialog({
        title: t("music_detail.lyric_ctx_download_lyric"),
        defaultPath:
          currentMusicRef.current.title +
          (fileType === "lrc" ? ".lrc" : ".txt"),
        filters: [
          {
            name: t("media.media_type_lyric"),
            extensions: ["lrc", "txt"],
          },
        ],
      });
      if (!result.canceled && result.filePath) {
        await fsUtil.writeFile(result.filePath, rawLrc, "utf-8");
        toast.success(t("music_detail.lyric_ctx_download_success"));
      } else {
        throw new Error();
      }
    } catch {
      toast.error(t("music_detail.lyric_ctx_download_fail"));
    }
  }

  return (
    <>
      <div className="lyric-ctx-menu--set-font-title">
        {t("music_detail.lyric_ctx_set_font_size")}
      </div>
      <div
        className="lyric-ctx-menu--font-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          role="button"
          className="font-size-button"
          onClick={() => {
            if (fontSize) {
              setFontSize((prev) => {
                const newFontSize = +prev - 1;
                handleFontSize(newFontSize);
                if (newFontSize < 8) {
                  return "8";
                } else if (newFontSize > 32) {
                  return "32";
                }
                return `${newFontSize}`;
              });
            }
          }}
        >
          <SvgAsset iconName="font-size-smaller"></SvgAsset>
        </div>
        <input
          type="number"
          max={32}
          min={8}
          value={fontSize}
          onChange={(e) => {
            const val = e.target.value;
            handleFontSize(val);
            setFontSize(e.target.value.trim());
          }}
        ></input>
        <div
          role="button"
          className="font-size-button"
          onClick={() => {
            if (fontSize) {
              setFontSize((prev) => {
                const newFontSize = +prev + 1;
                handleFontSize(newFontSize);
                if (newFontSize < 8) {
                  return "8";
                } else if (newFontSize > 32) {
                  return "32";
                }
                return `${newFontSize}`;
              });
            }
          }}
        >
          <SvgAsset iconName="font-size-larger"></SvgAsset>
        </div>
      </div>
      <div className="divider"></div>
      <div
        className="lyric-ctx-menu--row-container"
        role="button"
        data-disabled={!lyricParser?.hasTranslation}
        onClick={() => {
          setShowTranslation(!showTranslation);
        }}
      >
        {showTranslation
          ? t("music_detail.hide_translation")
          : t("music_detail.show_translation")}
      </div>
      <div
        className="lyric-ctx-menu--row-container"
        role="button"
        data-disabled={!lyricParser}
        onClick={() => {
          downloadLyric("lrc");
        }}
      >
        {t("music_detail.lyric_ctx_download_lyric_lrc")}
      </div>
      <div
        className="lyric-ctx-menu--row-container"
        role="button"
        data-disabled={!lyricParser}
        onClick={() => {
          downloadLyric("txt");
        }}
      >
        {t("music_detail.lyric_ctx_download_lyric_txt")}
      </div>
      <div className="divider"></div>
      <div
        className="lyric-ctx-menu--row-container"
        role="button"
        onClick={() => {
          showModal("SearchLyric", {
            defaultTitle: currentMusicRef.current.title,
            musicItem: currentMusicRef.current,
          });
        }}
      >
        <span>
          {linkedLyricInfo
            ? `${t("music_detail.media_lyric_linked")} ${getMediaPrimaryKey(
                linkedLyricInfo
              )}`
            : t("music_detail.search_lyric")}
        </span>
      </div>
      <div
        className="lyric-ctx-menu--row-container"
        role="button"
        data-disabled={!linkedLyricInfo}
        onClick={async () => {
          try {
            await unlinkLyric(currentMusicRef.current);
            if (trackPlayer.isCurrentMusic(currentMusicRef.current)) {
                trackPlayer.fetchCurrentLyric(true);
            }
            toast.success(t("music_detail.toast_media_lyric_unlinked"));
          } catch {
              // pass
          }
        }}
      >
        {t("music_detail.unlink_media_lyric")}
      </div>
    </>
  );
}
