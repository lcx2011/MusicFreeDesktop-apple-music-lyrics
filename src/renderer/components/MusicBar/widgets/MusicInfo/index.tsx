import SvgAsset from "@/renderer/components/SvgAsset";
import {setFallbackAlbum} from "@/renderer/utils/img-on-error";
import "./index.scss";

import MusicDetail, {useMusicDetailShown} from "@/renderer/components/MusicDetail";
import albumImg from "@/assets/imgs/album-cover.jpg";
import {useTranslation} from "react-i18next";
import {useCurrentMusic} from "@renderer/core/track-player/hooks";
import {hidePanel} from "@renderer/components/Panel";

export default function MusicInfo() {
    const musicItem = useCurrentMusic();
    const musicDetailShown = useMusicDetailShown();
    const {t} = useTranslation();

    function toggleMusicDetail() {
        if (musicDetailShown) {
            MusicDetail.hide();
        } else {
            MusicDetail.show();
            hidePanel();
        }
    }

    if (!musicItem) {
        return <div className="music-info empty">{t("music_bar.no_music")}</div>;
    }

    return (
        <div className="music-info" data-detail-shown={musicDetailShown}>
            <div className="music-cover-wrapper" role="button" onClick={toggleMusicDetail}>
                <img
                    className="music-cover"
                    crossOrigin="anonymous"
                    src={musicItem.artwork ?? albumImg}
                    onError={setFallbackAlbum}
                    alt={musicItem.title}
                />
                <div className="music-cover-mask">
                    <SvgAsset
                        iconName={musicDetailShown ? "chevron-double-down" : "chevron-double-up"}
                    ></SvgAsset>
                </div>
            </div>
            <div className="music-meta">
                <div
                    className="music-title"
                    role="button"
                    title={musicItem.title}
                    onClick={toggleMusicDetail}
                >
                    {musicItem.title}
                </div>
                <div className="music-artist" title={musicItem.artist}>
                    {musicItem.artist || t("music_bar.unknown_artist")}
                </div>
            </div>
        </div>
    );
}
