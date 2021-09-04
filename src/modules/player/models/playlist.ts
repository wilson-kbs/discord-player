import { Track } from "./track";

export class Playlist extends Array<Track> {
  getTrack(trackId: number): Track | undefined {
    const item = this[trackId - 1];
    if (item instanceof Track) return item;
    return undefined;
  }

  addTrack(track: Track): boolean {
    if (track instanceof Track) {
      this.push(track);
      return true;
    }
    return false;
  }

  removeTrack(trackId: number): boolean {
    const item = this[trackId];
    if (!item) return false;
    this.splice(trackId, 1);
    return true;
  }

  private _getTitle(item: Track) {
    return item.title;
  }

  /**
   *
   * @param start Track ID
   * @param end Track ID
   * @param recurse true for get exacte number element
   * @returns
   */
  getNextTitleTracks(
    trackId: number,
    num: number,
    recurse: boolean = false
  ): Array<string> {
    const Titles: Array<string> = [];

    const NumberElement = this.length;
    /** response number element */
    const resNumEl = num - trackId;

    const numElAllowGet = NumberElement - num;

    if ((!recurse && trackId > this.length) || resNumEl <= 0) return [];

    if (!recurse && trackId + num <= this.length)
      return this.slice(trackId, trackId + num).map((item) => item.title);
    else if (recurse) {
      let start = trackId - 1;
      Titles.push(...this.slice(start).map(this._getTitle));
      if (Titles.length == num) return Titles;
      const numRestItem = num - Titles.length;
      const iter = Math.floor(numRestItem / this.length);
      const restAfterEndloop = numRestItem % this.length;
      for (let i = 0; i < iter; i++) {
        const subIter = i == iter ? restAfterEndloop : this.length;
        for (let j = 0; j < subIter; j++) {
          Titles.push(...this.slice(j, j + 1).map(this._getTitle));
        }
      }
    } else {
      return this.slice(trackId, trackId + num).map((item) => item.title);
    }
    return Titles;
  }
}
