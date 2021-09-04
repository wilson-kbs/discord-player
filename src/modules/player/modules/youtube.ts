import {
  validateID,
  getInfo,
  filterFormats,
  downloadFromInfo,
} from "ytdl-core";

import ytpl from "ytpl";
import * as execa from "execa";
import { PassThrough } from "stream";
import { Track } from "../models";

export interface YTParseURL {
  url: string;
  id: string;
  t: number;
}

type YTURL = string;

const regExp =
  /^https?\:\/\/(?:www\.youtube\.com\/|m\.youtube\.com\/|music\.youtube\.com\/|youtube\.com\/)?(?:\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|playlist\?(?:.\&)?list=|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)(?:(?:\?|\&)?list=(?:[^#\&\?\n\/<>"']*)?)?(?:[\?\&]index=(?:\d+)?)?(?:[\?\&]t=)?(\d+)?$/i;

export class YoutubePlug {
  validateURL(url: string): url is YTURL {
    const p = this.parseURL(url);
    if (!p) return false;

    if (ytpl.validateID(p.id) || validateID(p.id)) return true;

    return false;
  }

  parseURL(url: string): YTParseURL {
    const match = url.match(regExp);

    if (!Array.isArray(match))
      throw new Error(
        "Erreur lors de la lecture du lien youtube. Veuillez un lien youtube valide"
      );

    // const url = match[0];
    const id = match[1];
    let time = parseInt(match[2], 10);
    if (isNaN(time)) time = 0;

    const result: YTParseURL = {
      url,
      id,
      t: time,
    };

    return result;
  }

  async getTracks(url: string): Promise<Track[] | Track> {
    if (!this.validateURL(url)) throw new Error("This is not youtube URL");

    const p = this.parseURL(url);

    // return array tracks
    if (ytpl.validateID(p.id)) {
      const tracks: Track[] = [];
      const info = await ytpl(p.id);

      info.items.forEach((item) => {
        tracks.push(
          new Track(item.url, item.title, 0, item.durationSec ?? undefined)
        );
      });
      return tracks;
    }

    // return single track
    else if (validateID(p.id)) {
      let item = await getInfo(p.id);
      let duration: number | undefined = parseInt(
        item.videoDetails.lengthSeconds
      );
      if (isNaN(duration)) duration = undefined;

      return new Track(
        item.videoDetails.video_url,
        item.videoDetails.title,
        p.t,
        duration
      );
    } else
      throw new Error(
        `This is not youtube valid playlist or watch ID "${p.id}"`
      );
  }

  async getAudioStream(url: YTURL) {
    try {
      const info = await getInfo(url);

      let audioFormats = filterFormats(info.formats, "audioonly");
      if (audioFormats.length <= 0)
        throw new Error("This video have not audio format.");
      let formats = audioFormats.filter(
        (item) =>
          item.audioCodec == "opus" && item.audioQuality?.includes("MEDIUM")
      );
      if (formats.length == 0)
        formats = audioFormats.filter((item) => item.audioCodec == "opus");
      return downloadFromInfo(info, {
        format: formats[0] ?? audioFormats[0],
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
