import { MessageButtonStyleResolvable } from "discord.js";

export interface ActionButtonState {
  id: string;
  name?: string;
  payload: string;
  default?: boolean;
  style: MessageButtonStyleResolvable;
  disable: boolean;
}

export interface ActionButton {
  id: string;
  states: Array<ActionButtonState>;
}

export interface ActionStates {
  play_pause: "PLAY" | "PAUSE";
  prev: "DEFAULT";
  next: "DEFAULT";
  stop: "DENIE" | "ALLOW";
  repeat: "NONE" | "ALL" | "ONE";
  mute: "DISABLE" | "ACTIVE";
  vol_down: "DEFAULT";
  vol_up: "DEFAULT";
}

export interface EmbedPlayerStates {
  titleTrack: string;
  urlTrack: string;
  thumbnailTrack: string;
  thumbnailPlayer: string;
  time: number;
  duration: number | undefined;
  nextTracks: Array<string>;
}

export interface EmbedPlaylistStates {
  track: Array<string>;
}

export interface EmbedViewState {
  player: EmbedPlayerStates;
  playlist: EmbedPlaylistStates;
}
