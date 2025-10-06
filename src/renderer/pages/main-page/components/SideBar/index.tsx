import { useCallback, useMemo, useState } from "react";
import { useMatch, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import SvgAsset from "@/renderer/components/SvgAsset";
import { defaultSheet } from "@/renderer/core/music-sheet";
import { localPluginName } from "@/common/constant";

import "./index.scss";

type NavItemKey =
  | "toggle"
  | "favorite"
  | "download"
  | "local"
  | "plugin"
  | "recently"
  | "mySheets";

export default function SideBar() {
  const navigate = useNavigate();
  const routePathMatch = useMatch("/main/:routePath");
  const favoriteSheetRoute = `/main/musicsheet/${encodeURIComponent(
    localPluginName
  )}/${encodeURIComponent(defaultSheet.id)}`;
  const favoriteSheetMatch = useMatch(favoriteSheetRoute);
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
  const handleNavigateFavorite = useCallback(() => {
    navigate(
      `/main/musicsheet/${encodeURIComponent(
        localPluginName
      )}/${encodeURIComponent(defaultSheet.id)}`
    );
  }, [navigate]);

  const handleNavigateMySheets = useCallback(() => {
    navigate("/main/mysheets");
  }, [navigate]);

  const navItems = useMemo(
    () =>
      [
        {
          key: "toggle" satisfies NavItemKey,
          iconName: "list-bullet" as const,
          title: expanded ? "收起菜单" : "展开菜单",
          onClick: () => setExpanded((prev) => !prev),
          selected: false,
        },
        {
          key: "favorite" satisfies NavItemKey,
          iconName: "heart-outline" as const,
          title: t("media.default_favorite_sheet_name"),
          onClick: handleNavigateFavorite,
          selected: Boolean(favoriteSheetMatch),
        },
        {
          key: "download" satisfies NavItemKey,
          iconName: "array-download-tray" as const,
          title: t("side_bar.download_management"),
          onClick: () => navigate("/main/download"),
          selected: routePathMatch?.params?.routePath === "download",
        },
        {
          key: "local" satisfies NavItemKey,
          iconName: "folder-open" as const,
          title: t("side_bar.local_music"),
          onClick: () => navigate("/main/local-music"),
          selected: routePathMatch?.params?.routePath === "local-music",
        },
        {
          key: "plugin" satisfies NavItemKey,
          iconName: "code-bracket-square" as const,
          title: t("side_bar.plugin_management"),
          onClick: () => navigate("/main/plugin-manager-view"),
          selected:
            routePathMatch?.params?.routePath === "plugin-manager-view",
        },
        {
          key: "recently" satisfies NavItemKey,
          iconName: "clock" as const,
          title: t("side_bar.recently_play"),
          onClick: () => navigate("/main/recently_play"),
          selected: routePathMatch?.params?.routePath === "recently_play",
        },
        {
          key: "mySheets" satisfies NavItemKey,
          iconName: "playlist" as const,
          title: t("side_bar.my_sheets"),
          onClick: handleNavigateMySheets,
          selected: routePathMatch?.params?.routePath === "mysheets",
        },
      ],
    [
      expanded,
      favoriteSheetMatch,
      handleNavigateFavorite,
      handleNavigateMySheets,
      navigate,
      routePathMatch?.params?.routePath,
      t,
    ]
  );

  return (
    <div
      className={`side-bar-container ${expanded ? "is-expanded" : "is-collapsed"}`}
    >
      <div className="side-bar__menu">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className="side-bar__item"
            data-selected={item.selected}
            onClick={item.onClick}
            title={item.title}
          >
            <SvgAsset iconName={item.iconName} size={24}></SvgAsset>
            {expanded ? <span>{item.title}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
