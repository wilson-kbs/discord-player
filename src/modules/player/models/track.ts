export class Track {
  url: string;
  title: string;
  timeToStart: number;
  duraction?: number;

  constructor(
    url: string,
    title: string,
    timeToStart: number,
    duration?: number
  ) {
    this.url = url;
    this.title = title;
    this.timeToStart = timeToStart;
    this.duraction = duration;
  }
}
