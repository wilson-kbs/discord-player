import { Readable } from "stream";
import { EventEmitter } from "events";

import { YoutubePlug } from "./modules/youtube";
import { PlayerEvents } from "./type";
import { Track } from "./models";

export class PlayerSystem extends EventEmitter {
  private _yt: YoutubePlug;

  constructor() {
    super();
    this._yt = new YoutubePlug();
  }

  protected isValidUrl(url: string) {
    try {
      new URL(url);
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }

  protected async fetchTraks(url: string): Promise<Track | Track[]> {
    if (!this.isValidUrl(url)) throw new Error("Le lien n'est pas valide");
    return await this._yt.getTracks(url);
  }

  protected async getStream(track: Track): Promise<Readable> {
    return await this._yt.getAudioStream(track.url);
  }
}
