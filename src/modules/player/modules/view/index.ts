import {
  Collection,
  Guild,
  Message,
  MessageActionRow,
  MessageButton,
  MessageButtonStyleResolvable,
  MessageEmbed,
} from "discord.js";
import {
  ActionStates,
  EmbedPlayerStates,
  EmbedPlaylistStates,
  EmbedViewState,
} from "../../types/view";
import { Playlist } from "../../models/playlist";
import { PlayerErrorString } from "../../utils";
import { PlayingState } from "../../types";
import { PlayViewButtons } from "./actions";
import { PlayerViewEmbeds } from "./player";
import { ResponseMessage } from "../../types/messages";
import { Config as PlayerConfig } from "@modules/player/models";
import Client from "@modules/client";

export interface PlayerViewInitOption {
  client: Client;
  config: PlayerConfig;
  guild: Guild;
}

export class PlayerView {
  private _config!: PlayerConfig;

  private _guild!: Guild;

  private _intervalUpdate!: NodeJS.Timer;

  private _embedView: PlayerViewEmbeds;

  private _buttonView: PlayViewButtons;

  /**
   * Instance Of Discord Message
   */
  private _instances: Collection<string, Message>;

  private _statePlayer: EmbedPlayerStates;

  private _statePlaylist: EmbedPlaylistStates;

  get instances() {
    return this._instances;
  }

  private updateView() {
    const response = this.tofResponse();

    this._instances.forEach(async (message) =>
      this.updateInstanceFromData(response, message)
    );
  }

  private updateInstanceFromData(data: ResponseMessage, instance: Message) {
    if (!instance.editable) {
      return console.error(
        `Message not editable in {Guild: ${instance.guildId}, Channel: ${instance.channelId}, message: ${instance.id}}`
      );
    }
    instance.edit(data);
  }

  startUpadateInterval(timeIntervalUpdate: number = 5_000) {
    this.stopUpdate();
    this.forceUpdate();
    this._intervalUpdate = setInterval(
      () => this.updateView(),
      timeIntervalUpdate
    );
  }

  stopUpdate() {
    clearInterval(this._intervalUpdate);
  }

  forceUpdate() {
    this.updateView();
  }

  tofResponse(): ResponseMessage {
    return {
      embeds: this._embedView.playerFromState(this._statePlayer),
      components: this._buttonView.getActionRowButtons(),
    };
  }

  updatePlayerState<K extends keyof EmbedPlayerStates>(
    key: K,
    value: EmbedPlayerStates[K]
  ) {
    this._statePlayer[key] = value;
  }

  setPlaylist(list: Playlist) {}

  registerInstance(id: string, instance: Message) {
    this._instances.set(id, instance);
    this.updateInstanceFromData(this.tofResponse(), instance);
  }

  private async registerInstanceFromId(key: string, instanceId: string) {
    const channel = await this._guild.channels.fetch(key);
    if (!channel || !channel.isText()) {
      this._config.playerChannels.removeMessageId(key);
      throw new Error("");
    }

    try {
      const message = await channel.messages.fetch(instanceId);

      this.registerInstance(key, message);
    } catch (error) {
      this._config.playerChannels.removeMessageId(key);
      this._instances.delete(key);
    }
  }

  async init(options: PlayerViewInitOption) {
    this._config = options.config;
    this._guild = options.guild;

    if (options.config.playerChannels.isLocked()) {
      const channelId = options.config.playerChannels.id;
      const messageId = options.config.playerChannels.getMessageId(channelId);
      if (messageId) {
        await this.registerInstanceFromId(channelId, messageId);
      }
    } else {
      options.config.playerChannels.messagesPlayer.forEach((path) =>
        this.registerInstanceFromId(path.channelId, path.messageId)
      );
    }
  }

  constructor() {
    this._embedView = new PlayerViewEmbeds();
    this._buttonView = new PlayViewButtons();
    this._instances = new Collection();

    this._statePlayer = {
      titleTrack: "Aucun element dans le liste",
      nextTracks: [],
      thumbnailTrack: "",
      thumbnailPlayer: "",
      urlTrack: "",
      time: 0,
      duration: undefined,
    };

    this._statePlaylist = {
      track: [],
    };
  }
}
