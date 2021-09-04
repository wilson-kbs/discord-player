import { Exclude, Expose, Type } from "class-transformer";
import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  joinVoiceChannel,
  VoiceConnection,
} from "@discordjs/voice";
import {
  Collection,
  Guild,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageButtonStyleResolvable,
  MessageEditOptions,
  MessageEmbed,
} from "discord.js";
import { PlayerView } from "../modules/view";
import { TrackManager } from "../modules/track-manager";
import { Config as GuildConfig } from "./config";
import { PlayingState } from "../types";
import { Playlist } from "./playlist";
import { Track } from "./track";
import { Client } from "@modules/client";

export enum GuildPlayerState {
  Playing = "playing",
  Paused = "paused",
  Idle = "idle",
  Stoped = "stoped",
}

export enum ReapeatState {
  NONE = "none",
  ALL = "all",
  ONE = "one",
}

export interface GuildPlayerInitOptions {
  client: Client;
  config: GuildConfig;
  guild: Guild;
}

export class GuildPlayer {
  // DATA SAVE //
  ///////////////

  private playingTime: number;

  private currentTrack: number;

  private playerState: GuildPlayerState;

  private repeatState: ReapeatState;

  private volume: number;

  private mute: boolean;

  @Type(() => Track)
  playlist: Playlist;

  // NOT SAVE DATA //
  ///////////////////

  private _guild!: Guild;

  private _config!: GuildConfig;

  private _bot!: GuildMember;

  private _view!: PlayerView;

  private _interval!: NodeJS.Timer;

  private _connection?: VoiceConnection;

  private _playerSystem?: AudioPlayer;

  private _currentStream?: AudioResource;

  private _voiceAdaptators: Collection<string, DiscordGatewayAdapterCreator>;

  private _trackHandler!: TrackManager;

  // GETTERS //
  /////////////

  get playable(): boolean {
    return this._connection ? true : false;
  }

  get view(): PlayerView {
    return this._view;
  }

  get state(): GuildPlayerState {
    return this.playerState;
  }

  get bot() {
    return this._bot;
  }

  // PRIVATE FUNCTIONS //
  ///////////////////////

  private throwIsPlayagble() {
    if (!this._connection)
      throw new Error("Connection is undefine on player state");

    // if (!this._guildVoiceAdaptator)
    //   throw new Error("guild voice adaptator is undefined");

    if (!this._bot) throw new Error("Bot guildmember in undefined");
  }

  private getVoiceConnection(channelId: string) {
    if (this._connection && this._connection.joinConfig.channelId)
      return this._connection;

    const voiceAdaptator = this._voiceAdaptators.get(channelId);
    if (!voiceAdaptator)
      throw new Error("voiceChannelAdaptator is undefine in player guild");

    const connection = joinVoiceChannel({
      channelId,
      guildId: this._config.guildId,
      adapterCreator: voiceAdaptator,
    });

    if (!this._playerSystem) {
      const audioPlayer = this.getPlayerSystem();
      this.addEventPlayer(audioPlayer);
      connection.subscribe(audioPlayer);
    }

    this.addEventsConnection(connection);

    this._connection = connection;

    return this._connection;
  }

  private getPlayerSystem() {
    if (this._playerSystem) return this._playerSystem;
    const playerSystem = createAudioPlayer({});

    this.addEventPlayer(playerSystem);

    this._playerSystem = playerSystem;

    return this._playerSystem;
  }

  private async getStream(track: Track) {
    const rawStream = await this._trackHandler.getStream(track);
    const stream = createAudioResource(rawStream, {
      inlineVolume: true,
      metadata: {
        title: track.title,
      },
    });

    this._currentStream = stream;
    return this._currentStream;
  }

  private purgeConnection() {
    if (this._playerSystem) this._playerSystem.stop();
    if (this._connection) this._connection.destroy();
    delete this._currentStream;
    delete this._playerSystem;
    delete this._connection;
  }

  private setIntervalUpdateState(interval: number = 2_500) {
    this.clearIntervalUpdateState();
    this._interval = setInterval(() => {
      switch (this.playerState) {
        case GuildPlayerState.Playing:
          if (this._currentStream)
            this._view.updatePlayerState(
              "time",
              this._currentStream.playbackDuration / 1_000 // milliseconds to seconds
            );

          break;
        case GuildPlayerState.Paused:
          if (this._currentStream)
            this._view.updatePlayerState(
              "time",
              this._currentStream.playbackDuration / 1_000 // milliseconds to seconds
            );
          this.clearIntervalUpdateState();
          this._view.stopUpdate();
          this._view.forceUpdate();
          break;
        case GuildPlayerState.Idle:
          break;
        case GuildPlayerState.Stoped:
          if (this._currentStream)
            this._view.updatePlayerState(
              "time",
              this._currentStream.playbackDuration / 1_000 // milliseconds to seconds
            );
          this.clearIntervalUpdateState();
          this._view.forceUpdate();
          this._view.stopUpdate();
          this.purgeConnection();
          break;
      }
    }, interval);
  }

  private clearIntervalUpdateState() {
    clearInterval(this._interval);
  }

  private addEventPlayer(player: AudioPlayer) {
    player.on(AudioPlayerStatus.Playing, () => {
      this.playerState = GuildPlayerState.Playing;

      this.setIntervalUpdateState();

      this._view.startUpadateInterval();
    });

    player.on(AudioPlayerStatus.Paused, () => {
      this.playerState = GuildPlayerState.Paused;
      if (this._currentStream)
        this._view.updatePlayerState(
          "time",
          this._currentStream.playbackDuration / 1_000 // milliseconds to seconds
        );
      this.clearIntervalUpdateState();
      this._view.stopUpdate();
      this._view.forceUpdate();
    });

    player.on(AudioPlayerStatus.Idle, () => {
      // update view
      this._view.updatePlayerState("time", 0);
      this._view.updatePlayerState("duration", undefined);
      this._view.updatePlayerState("titleTrack", "");
      this._view.updatePlayerState("urlTrack", "");
      this._view.forceUpdate();
      this.next();
      this.clearIntervalUpdateState();
    });

    player.on("error", (error) => {
      console.error(error);

      this.purgeConnection();
      this.clearIntervalUpdateState();
      this._view.stopUpdate();
    });
  }

  private addEventsConnection(connection: VoiceConnection) {
    connection.on("error", (error) => {
      console.error(error);

      this.purgeConnection();
      this.clearIntervalUpdateState();
      this._view.stopUpdate();
    });

    connection.on("debug", async (msg) => console.log(msg));
  }

  private defaultPlayerViewState() {
    const track = this.playlist.getTrack(this.currentTrack);
    if (track) {
      this._view.updatePlayerState("titleTrack", track.title);
      this._view.updatePlayerState("urlTrack", track.url);
      this._view.updatePlayerState("duration", track.duraction);
      // this._view.updatePlayerState();
    }
    this._view.updatePlayerState(
      "nextTracks",
      this.playlist.getNextTitleTracks(this.currentTrack, 5, false)
    );
    this._view.forceUpdate();
  }

  // PUBLIC FUNCTIONS //
  //////////////////////

  public connect(channelId?: string) {
    if (
      channelId &&
      channelId != this._config.voiceChannel.id &&
      !this._config.voiceChannel.isLocked
    ) {
      const voiceAdaptator = this._voiceAdaptators.get(channelId);
      if (!voiceAdaptator) throw new Error("voiceChannelAdaptator not found");

      const channel = this._guild.channels.cache.get(channelId);
      if (!channel)
        throw new Error("Channel not foud on guild in play command");
      if (!channel.isVoice())
        throw new Error("channel is not voice on play command");

      this._config.voiceChannel.id = channelId;

      this.getVoiceConnection(channelId);
    }

    if (!this._connection)
      this.getVoiceConnection(this._config.voiceChannel.id);

    return this;
  }

  public async play() {
    // this.throwIsPlayagble();
    const playerSystem = this.getPlayerSystem();
    if (playerSystem.state.status == "paused") playerSystem.unpause();
    if (playerSystem.state.status == "playing") return;
    const Track = this.playlist.getTrack(this.currentTrack);
    if (!Track) throw new Error("Track not found in playlist");
    const stream = await this.getStream(Track);

    // update view
    this._view.updatePlayerState("time", 0);
    this._view.updatePlayerState("duration", Track.duraction);
    this._view.updatePlayerState("titleTrack", Track.title);
    this._view.updatePlayerState("urlTrack", Track.url);
    this._view.forceUpdate();

    playerSystem.play(stream);
  }

  public playTrack(Track: Track) {
    return this;
  }

  public pause() {
    this.throwIsPlayagble();
    if (this._playerSystem?.state.status == "playing")
      this._playerSystem.pause();
    this.playerState = GuildPlayerState.Paused;
  }

  public stop() {
    this.throwIsPlayagble();
    if (this._playerSystem) this._playerSystem.stop();
    delete this._playerSystem;
    delete this._currentStream;
    if (this._connection) this._connection;
  }

  public prev() {
    return this;
  }

  public next() {
    return this;
  }

  public addTracks(tracks: Array<Track>) {
    tracks.forEach((item) => {
      this.playlist.addTrack(item);
    });
    this._view.updatePlayerState(
      "nextTracks",
      this.playlist.getNextTitleTracks(this.currentTrack, 5, false)
    );
    this._view.forceUpdate();
  }

  public async addTracksFromURL(url: string) {
    const Tracks = await this._trackHandler.trackFromUrl(url);
    if (!Tracks) return false;
    if (Array.isArray(Tracks)) {
      Tracks.forEach((item) => {
        this.playlist.addTrack(item);
      });
    } else this.playlist.addTrack(Tracks);
    this.defaultPlayerViewState();
    this._view.forceUpdate();
    return true;
  }

  public setVolume(value: number) {
    this.volume = value;
    if (this._currentStream?.volume)
      this._currentStream.volume.setVolume(value / 100);
    return this;
  }

  public setMute(value: boolean) {
    this.mute = value;

    this._bot.voice.setMute(value);
    return this;
  }

  // INIT FUNCTION //
  ///////////////////

  public async init(options: GuildPlayerInitOptions) {
    console.log(this.playlist.getNextTitleTracks(this.currentTrack, 5, false));

    await this._view.init({
      client: options.client,
      config: options.config,
      guild: options.guild,
    });

    this._config = options.config;
    this._guild = options.guild;

    const playerUser = options.guild.me;
    if (!playerUser) {
      throw new Error(
        `GuildMember bot user not found {id: ${options.guild.id}}`
      );
    }
    this._bot = playerUser;

    const channels = await options.guild.channels.fetch();

    channels.forEach((channel) => {
      if (!channel.isVoice()) return;

      this._voiceAdaptators.set(channel.id, channel.guild.voiceAdapterCreator);
    });

    this.playerState = GuildPlayerState.Stoped;

    this.defaultPlayerViewState();
  }

  // CONSTRUCTOR //
  /////////////////

  constructor() {
    this._trackHandler = new TrackManager();

    this._view = new PlayerView();

    this._voiceAdaptators = new Collection();

    // default values

    this.volume = 0.5;

    this.mute = false;

    this.playingTime = 0;

    this.currentTrack = 1; // Playlist first index element is 1

    this.playlist = new Playlist();

    this.playerState = GuildPlayerState.Idle;

    this.repeatState = ReapeatState.NONE;
  }
}
