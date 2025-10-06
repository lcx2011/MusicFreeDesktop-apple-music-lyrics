import SvgAsset from "../SvgAsset";
import "./index.scss";
import {showModal} from "../Modal";
import {useNavigate} from "react-router-dom";
import {useRef} from "react";
import HeaderNavigator from "./widgets/Navigator";
import MusicDetail from "../MusicDetail";
import {useTranslation} from "react-i18next";
import AppConfig from "@shared/app-config/renderer";
import {appUtil, appWindowUtil} from "@shared/utils/renderer";
import {musicDetailShownStore} from "@renderer/components/MusicDetail/store";

export default function AppHeader() {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>();
    
    const {t} = useTranslation();

    function onSearchSubmit() {
        if (inputRef.current.value) {
            search(inputRef.current.value);
        }
    }

    function search(keyword: string) {
        navigate(`/main/search/${encodeURIComponent(keyword)}`);
        musicDetailShownStore.setValue(false);
    }

    return (
        <div className="header-container">
            <div className="left-part">
                <div className="logo">
                    <SvgAsset iconName="logo"></SvgAsset>
                </div>
                <HeaderNavigator></HeaderNavigator>
                <div id="header-search" className="header-search">
                    <input
                        ref={inputRef}
                        className="header-search-input"
                        placeholder="搜索"
                        maxLength={50}
                        onKeyDown={(key) => {
                            if (key.key === "Enter") {
                                onSearchSubmit();
                            }
                        }}
                    ></input>
                    <div className="search-submit" role="button" onClick={onSearchSubmit}>
                        <SvgAsset iconName="magnifying-glass"></SvgAsset>
                    </div>
                </div>
            </div>

            <div className="right-part">
                <div
                    role="button"
                    className="header-button sparkles-icon"
                    onClick={() => {
                        showModal("Sparkles");
                    }}
                >
                    <SvgAsset iconName="sparkles"></SvgAsset>
                </div>
                <div
                    role="button"
                    className="header-button"
                    title={t("app_header.settings")}
                    onClick={() => {
                        navigate("/main/setting");
                        MusicDetail.hide();
                    }}
                >
                    <SvgAsset iconName="cog-8-tooth"></SvgAsset>
                </div>
                <div className="header-divider"></div>
                <div
                    role="button"
                    title={t("app_header.minimize")}
                    className="header-button"
                    onClick={() => {
                        appWindowUtil.minMainWindow();
                    }}
                >
                    <SvgAsset iconName="minus"></SvgAsset>
                </div>
                <div role="button" className="header-button" onClick={() => {
                    appWindowUtil.toggleMainWindowMaximize();
                }}>
                    <SvgAsset iconName="square"></SvgAsset>
                </div>
                <div
                    role="button"
                    title={t("app_header.exit")}
                    className="header-button"
                    onClick={() => {
                        const exitBehavior = AppConfig.getConfig("normal.closeBehavior");
                        if (exitBehavior === "minimize") {
                            appWindowUtil.minMainWindow(true);
                        } else {
                            appUtil.exitApp();
                        }
                    }}
                >
                    <SvgAsset iconName="x-mark"></SvgAsset>
                </div>
            </div>
        </div>
    );
}
