import Slider from "./widgets/Slider";
import MusicInfo from "./widgets/MusicInfo";
import Controller from "./widgets/Controller";
import Extra from "./widgets/Extra";
import {musicDetailShownStore} from "@renderer/components/MusicDetail/store";

import "./index.scss";

export default function MusicBar() {
  const musicDetailShown = musicDetailShownStore.useValue();

  if (musicDetailShown) {
    return null;
  }

  return (
    <div className="music-bar-container background-color">
      <Slider></Slider>
      <MusicInfo></MusicInfo>
      <Controller></Controller>
      <Extra></Extra>
    </div>
  );
}
