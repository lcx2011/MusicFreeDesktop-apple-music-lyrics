import { useParams } from "react-router-dom";
import MusicSheetlikeView from "@/renderer/components/MusicSheetlikeView";
import { RequestStateCode, localPluginName } from "@/common/constant";
import MusicSheet, { defaultSheet } from "@/renderer/core/music-sheet";
import { useTranslation } from "react-i18next";
import FavoriteSheet from "./favorite-sheet";

export default function LocalSheet() {
  const { id } = useParams() ?? {};
  const [musicSheet, loading] = MusicSheet.frontend.useMusicSheet(id);
  const { t } = useTranslation();
  const isFavoriteSheet = id === defaultSheet.id;

  const resolvedMusicSheet = isFavoriteSheet
    ? {
        ...(musicSheet ?? {
          id: defaultSheet.id,
          platform: localPluginName,
        }),
        title: t("media.default_favorite_sheet_name"),
      }
    : musicSheet;

  if (isFavoriteSheet) {
    return (
      <FavoriteSheet
        musicSheet={resolvedMusicSheet}
        musicList={musicSheet?.musicList ?? []}
        state={loading}
      ></FavoriteSheet>
    );
  }

  return (
    <MusicSheetlikeView
      hidePlatform
      musicSheet={resolvedMusicSheet}
      state={loading}
      musicList={musicSheet?.musicList ?? []}
    ></MusicSheetlikeView>
  );
}
