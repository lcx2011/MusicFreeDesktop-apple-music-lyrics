import { Navigate, Route, Routes } from "react-router-dom";
import SideBar from "./components/SideBar";
import PluginManagerView from "./views/plugin-manager-view";
import MusicSheetView from "./views/music-sheet-view";
import SearchView from "./views/search-view";
import AlbumView from "./views/album-view";
import ArtistView from "./views/artist-view";
import SettingView from "./views/setting-view";
import LocalMusicView from "./views/local-music-view";
import Empty from "@/renderer/components/Empty";
import DownloadView from "./views/download-view";
import ThemeView from "./views/theme-view";
import RecentlyPlayView from "./views/recently-play-view";
import { defaultSheet } from "@/renderer/core/music-sheet";
import { localPluginName } from "@/common/constant";

import "./index.scss";

export default function MainPage() {
  return (
    <>
      <SideBar></SideBar>
      <Routes>
        <Route
          index
          element={
            <Navigate
              replace
              to={`musicsheet/${encodeURIComponent(localPluginName)}/${encodeURIComponent(defaultSheet.id)}`}
            ></Navigate>
          }
        ></Route>
        <Route path="search/:query" element={<SearchView></SearchView>}></Route>
        <Route
          path="plugin-manager-view"
          element={<PluginManagerView></PluginManagerView>}
        ></Route>
        <Route
          path="musicsheet/:platform/:id"
          element={<MusicSheetView></MusicSheetView>}
        ></Route>
        <Route
          path="album/:platform/:id"
          element={<AlbumView></AlbumView>}
        ></Route>
        <Route
          path="artist/:platform/:id"
          element={<ArtistView></ArtistView>}
        ></Route>
        <Route
          path="local-music"
          element={<LocalMusicView></LocalMusicView>}
        ></Route>
        <Route path="download" element={<DownloadView></DownloadView>}></Route>
        <Route path="setting" element={<SettingView></SettingView>}></Route>
        <Route path="theme" element={<ThemeView></ThemeView>}></Route>
        <Route
          path="recently_play"
          element={<RecentlyPlayView></RecentlyPlayView>}
        ></Route>
        <Route path="*" element={<Empty></Empty>}></Route>
      </Routes>
    </>
  );
}
