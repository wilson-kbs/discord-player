import { Sequelize, DataTypes, Model, ModelCtor } from "sequelize";
import { Expose, Exclude, classToPlain, Type } from "class-transformer";

import {
  generateDependencyReport,
  joinVoiceChannel,
  VoiceConnection,
  createAudioResource,
  StreamType,
  createAudioPlayer,
  AudioPlayer,
  AudioPlayerStatus,
} from "@discordjs/voice";

import Client from "@modules/client";
import { Storage, Store } from "@modules/storage";
import { PlayerSystem } from "./system";
import { PlayerErrorString } from "./utils";
import { PlayerConfig } from "./config";
import { GuildItem } from "./models/guild-item";
import { Playlist } from "./models/playlist";
import { ConfigChannel } from "./models/config";
import { Interaction, Message, TextChannel } from "discord.js";
import { channel } from "diagnostics_channel";
import { GuildPlayerState } from "./models";

type InitPlayer = () => Promise<Player>;

interface PlayerOptions {
  storage?: Storage;
  storeName?: string;
}

export class Player extends PlayerSystem {
  private _isInit: boolean;
  private _client: Client;
  private _store!: Store<GuildItem>;

  private _config!: PlayerConfig;

  init: InitPlayer;

  /** @readonly */
  get config() {
    return this._config;
  }

  private joinChannel(
    guildId: string,
    channelId: string
  ): VoiceConnection | null {
    const channel = this._client.channels.cache.get(channelId);
    if (!channel || !channel.isVoice()) return null;
    if (!channel.joinable)
      throw new Error(
        "Je n'est pas les droit nécessaire pour rejoindre le channel vocal"
      );

    return joinVoiceChannel({
      channelId,
      guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
  }

  // PUBLIC

  /**
   * True if guild is init
   * @returns {Boolean}
   */
  public guilIsinit(guildId: string): boolean {
    return this._store.has(guildId);
  }

  async Play_Pause(guildId: string, interaction: Interaction) {
    if (!interaction.inGuild() && !interaction.isButton())
      throw new Error(PlayerErrorString.default);
    const GuildItem = this._store.get(guildId);

    if (!GuildItem) throw new Error(PlayerErrorString.init);
    const player = GuildItem.player;
    if (!interaction.inGuild())
      throw new Error(
        "La command ne peut s'exécuter uniquement sur un serveur discord!"
      );

    const guild = interaction.guild;
    if (!guild)
      throw new Error("guild not fount on interaction in play command");

    const guildMember = guild.members.cache.get(interaction.user.id);
    if (!guildMember) throw new Error("je ne vous trouve pas sur le serveur!");

    const channelId = guildMember.voice.channelId;
    if (!channelId) throw new Error("Channel Id not found in Play command");

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error("Channel not foud on guild in play command");
    if (!channel.isVoice())
      throw new Error("channel is not voice on play command");
    try {
      if (GuildItem.player.state == GuildPlayerState.Playing) player.pause();
      else await player.connect(channelId).play();
      if (interaction.isButton()) interaction.deleteReply();
    } catch (error) {
      console.error(error);
      throw new Error(PlayerErrorString.default);
    }
  }

  async Play(guildId: string, interaction: Interaction) {
    if (
      !interaction.inGuild() &&
      !interaction.isCommand() &&
      !interaction.isButton()
    )
      return;
    const GuildItem = this._store.get(guildId);

    if (!GuildItem) throw new Error(PlayerErrorString.init);
    const player = GuildItem.player;
    if (!interaction.inGuild())
      throw new Error(
        "La command ne peut s'exécuter uniquement sur un serveur discord!"
      );

    const guild = interaction.guild;
    if (!guild)
      throw new Error("guild not fount on interaction in play command");

    const guildMember = guild.members.cache.get(interaction.user.id);
    if (!guildMember) throw new Error("je ne vous trouve pas sur le serveur!");

    const channelId = guildMember.voice.channelId;
    if (!channelId) throw new Error("Channel Id not found in Play command");

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error("Channel not foud on guild in play command");
    if (!channel.isVoice())
      throw new Error("channel is not voice on play command");

    await player.connect(channelId).play();
    if (interaction.isButton() || interaction.isCommand())
      interaction.deleteReply();
  }
  async Pause(guildId: string, interaction?: Interaction) {}
  async Previous(guildId: string, interaction?: Interaction) {}
  async Next(guildId: string, interaction?: Interaction) {}
  async Stop(guildId: string, interaction?: Interaction) {}
  async Playlist(guildId: string, interaction?: Interaction) {}
  async Reapeat(guildId: string, interaction?: Interaction) {}
  async Shuffle(guildId: string, interaction?: Interaction) {}
  async Volume(guildId: string, interaction?: Interaction) {}
  async Mute(guildId: string, interaction?: Interaction) {}
  async Add(guildId: string, interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const GuildItem = this._store.get(guildId);
    if (!GuildItem) throw new Error(PlayerErrorString.init);

    const url = interaction.options.getString("youtube_url");
    if (!url) throw new Error(PlayerErrorString.init);

    await GuildItem.player.addTracksFromURL(url);
    await GuildItem._forceSync();

    await interaction.editReply("Ajouter la playlist terminer.");

    setTimeout(() => interaction.deleteReply(), 5_000);
  }
  async Remove(guildId: string, interaction?: Interaction) {}
  async Kill() {}

  // async addFromURL(guildId: string, url: string) {}
  // async removeTrack(guildId: string, trackId: number) {}
  // async addFromURL(guildId: string, url: string) {}
  // async addFromURL(guildId: string, url: string) {}
  // async addFromURL(guildId: string, url: string) {}
  // async addFromURL(guildId: string, url: string) {}
  // async addFromURL(guildId: string, url: string) {}
  // async addFromURL(guildId: string, url: string) {}
  // async addFromURL(guildId: string, url: string) {}
  // async addFromURL(guildId: string, url: string) {}

  async showPlayer(guildId: string, channelId: string): Promise<string> {
    const Guild = this._client.guilds.cache.get(guildId);
    if (!Guild) {
      console.error("Guild not found in Discord.js");
      throw new Error(PlayerErrorString.default);
    }

    const GuildItem = this._store.get(guildId);
    if (!GuildItem) throw new Error(PlayerErrorString.init);

    const GuildConfig = GuildItem.config;
    const Player = GuildItem.player;

    let trueChannelId = channelId;

    // CHECK
    if (GuildConfig.playerChannels.isLocked()) {
      trueChannelId = GuildConfig.playerChannels.id;
    }

    const Channel = Guild.channels.cache.get(trueChannelId);

    if (!Channel) throw new Error(PlayerErrorString.default);

    if (Channel.isThread())
      throw new Error("Le player ne peut être afficher dans un Thread");

    if (!Channel.isText())
      throw new Error(
        "Le player ne peut être affiche que dans un Channel Text"
      );

    // PERMISION WRITE ON TEXTCHANNEL
    if (!Guild.me) throw new Error(PlayerErrorString.default);

    const BotPermision = Channel.permissionsFor(Guild.me);

    if (!BotPermision.has("SEND_MESSAGES"))
      throw new Error(
        `Je n'es pas les permisions pour écrire dans <#${trueChannelId}>`
      );

    // SEND PLAYER
    const message = await Channel.send(Player.view.tofResponse());

    GuildConfig.playerChannels.setMessageId(message.channelId, message.id);

    const oldMessage = Player.view.instances.get(message.channelId);

    if (oldMessage && oldMessage.deletable) oldMessage.delete();

    Player.view.instances.set(message.channelId, message);

    GuildItem._forceSync();

    return message.channelId;
  }

  async addTracksFromURL(guildId: string, url: string) {
    const GuildItem = this._store.get(guildId);
    if (!GuildItem) throw new Error(PlayerErrorString.init);

    const tracks = await this.fetchTraks(url);
    if (!GuildItem.player.playlist) GuildItem.player.playlist = new Playlist();
    if (Array.isArray(tracks)) {
      for (const track of tracks) {
        GuildItem.player.playlist.push(track);
      }
    } else GuildItem.player.playlist.push(tracks);
  }

  setVoiceChannelId(guildId: string, voiceChannelId: string) {
    const GuildItem = this._store.get(guildId);
    if (!GuildItem) throw new Error(PlayerErrorString.init);
    if (!GuildItem.config.voiceChannel)
      GuildItem.config.voiceChannel = new ConfigChannel(voiceChannelId, false);
    else {
      if (GuildItem.config.voiceChannel.isLocked)
        throw new Error(
          "le Channel vocal est bloquer. veuillez utiliser les commandes de configuration pour le changer"
        );
      GuildItem.config.voiceChannel.id = voiceChannelId;
    }
  }

  // newGuild(guildId: string) {
  //   const GuildItem = this._store.new(guildId);
  //   GuildItem.player.currentTrack = 0;
  //   GuildItem._forceSync();
  //   return this;
  // }

  // fakeUpdate(guildId: string, message: Message) {
  //   const GuildItem = this._store.get(guildId);
  //   if (!GuildItem) throw new Error(PlayerErrorString.init);
  //   const state = GuildItem.player;
  //   const fakeDuration = 196;

  //   state.message.embed.setDuration(fakeDuration);
  //   state.message.embed.updatePlayerTime(0);

  //   let timer: NodeJS.Timeout;
  //   let count = 0;

  //   function test123(message: Message) {
  //     if (count >= fakeDuration) clearInterval(timer);
  //     state.message.embed.updatePlayerTime(count);
  //     message.edit(state.message.rawMessage);
  //     count += 2;
  //   }

  //   message.reply(state.message.rawMessage).then((message) => {
  //     test123(message);
  //     timer = setInterval(() => test123(message), 2000);
  //   });
  // }

  // CONSTRUCTOR

  constructor(client: Client, options?: PlayerOptions) {
    super();

    if (options && !options.storage && !options.storeName)
      throw new Error(
        "storeName is undefine. Please set storeName on Player Options"
      );

    this._client = client;

    this._isInit = false;

    // init player
    async function init(this: Player) {
      // init store
      if (options && options.storage)
        this._store = await options.storage.newStore(
          options.storeName || "_musicPlayer",
          GuildItem
        );
      else
        this._store = await new Storage().newStore(
          options?.storeName || "_musicPlayer",
          GuildItem
        );

      // after init store

      this._config = new PlayerConfig(this._client, this._store);

      this._client.on("ready", () => {
        console.log("Player is initialized");
        // console.log(generateDependencyReport());
        this._store.forEach(async (GuildItem, guildId) => {
          const client = this._client;

          const guild = await this._client.guilds.fetch(guildId);

          if (!guild) {
            this._store.delete(guildId);
            return console.error(
              `guild introuvable {id: ${guildId}}. Suppression des données`
            );
          }

          await GuildItem.init({ client, guild });

          // register instance player view

          // if (GuildItem.config.playerChannels.isLocked()) {
          //   const channelId = GuildItem.config.playerChannels.id;
          //   const messageId =
          //     GuildItem.config.playerChannels.getMessageId(channelId);

          //   if (!!messageId && typeof messageId == "string") {
          //     const channel = guild.channels.cache.get(channelId);
          //     if (!channel || !channel.isText())
          //       return console.error(
          //         `Channel not found  {guildId: ${guildId}, channelId: ${channelId}}`
          //       );

          //     const messages = await channel.messages.fetch();
          //     const message = messages.get(messageId);

          //     if (!message)
          //       return console.error(
          //         `Message is not found  {guildId: ${guildId}, channelId: ${channelId}, messageId: ${messageId}}`
          //       );

          //     GuildItem.player.view.registerInstance(channelId, message);
          //   }
          // } else {
          //   GuildItem.config.playerChannels.messagesPlayer.forEach(
          //     async (PlayerPath) => {
          //       const channel = guild.channels.cache.get(PlayerPath.channelId);
          //       if (!channel || !channel.isText()) {
          //         GuildItem.config.playerChannels.removeMessageId(
          //           PlayerPath.channelId
          //         );
          //         return;
          //       }

          //       try {
          //         const message = await channel.messages.fetch(
          //           PlayerPath.messageId
          //         );

          //         GuildItem.player.view.registerInstance(
          //           PlayerPath.channelId,
          //           message
          //         );
          //       } catch (error) {
          //         GuildItem.config.playerChannels.removeMessageId(
          //           PlayerPath.channelId
          //         );
          //         GuildItem.player.view.instances.delete(PlayerPath.channelId);
          //       }
          //     }
          //   );
          // }
        });
      });

      setInterval(() => this._store.saveAll(), 5 * 60 * 1000); // sauvegarde toute les 5 min

      this._isInit = true;
      return this;
    }

    this.init = init.bind(this);
  }
}

export default Player;
