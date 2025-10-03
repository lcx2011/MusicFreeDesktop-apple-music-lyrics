import ListItem from "./widgets/ListItem";
import "./index.scss";
import MySheets from "./widgets/MySheets";
import { useMatch, useNavigate } from "react-router";
import StarredSheets from "./widgets/StarredSheets";
import { useTranslation } from "react-i18next";
import { defaultSheet } from "@/renderer/core/music-sheet";
import { localPluginName } from "@/common/constant";

export default function () {
  const navigate = useNavigate();
  const routePathMatch = useMatch("/main/:routePath");
  const favoriteSheetRoute = `/main/musicsheet/${encodeURIComponent(
    localPluginName
  )}/${encodeURIComponent(defaultSheet.id)}`;
  const favoriteSheetMatch = useMatch(favoriteSheetRoute);
  const { t } = useTranslation();

  const options = [
    {
      iconName: "array-download-tray",
      title: t("side_bar.download_management"),
      route: "download",
    },
    {
      iconName: "folder-open",
      title: t("side_bar.local_music"),
      route: "local-music",
    },
    {
      iconName: "code-bracket-square",
      title: t("side_bar.plugin_management"),
      route: "plugin-manager-view",
    },
    {
      iconName: "clock",
      title: t("side_bar.recently_play"),
      route: "recently_play",
    },
  ] as const;

  return (
    <div className="side-bar-container">
      <ListItem
        iconName="heart-outline"
        title={t("media.default_favorite_sheet_name")}
        selected={Boolean(favoriteSheetMatch)}
        onClick={() => {
          navigate(
            `/main/musicsheet/${encodeURIComponent(
              localPluginName
            )}/${encodeURIComponent(defaultSheet.id)}`
          );
        }}
      ></ListItem>
      {options.map((item) => (
        <ListItem
          key={item.route}
          iconName={item.iconName}
          title={item.title}
          selected={routePathMatch?.params?.routePath === item.route}
          onClick={() => {
            navigate(`/main/${item.route}`);
          }}
        ></ListItem>
      ))}
      <MySheets></MySheets>
      <StarredSheets></StarredSheets>
    </div>
  );
}
