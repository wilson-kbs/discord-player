import { Track } from "../models";
import { YoutubePlug } from "./youtube";

export class TrackManager {
  private _yt: YoutubePlug;

  isValidURL(url: string) {
    try {
      new URL(url);
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }

  async trackFromUrl(url: string): Promise<Track | Track[] | undefined> {
    if (!this.isValidURL(url)) return undefined;
    try {
      return await this._yt.getTracks(url);
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  async getStream(track: Track) {
    return await this._yt.getAudioStream(track.url);
  }

  constructor() {
    this._yt = new YoutubePlug();
  }
}
