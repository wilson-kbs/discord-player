import { Client } from "@modules/client";
import { Store } from "@modules/storage";
import { ConfigChannel, PlayerStateChannels } from "./models/config";
import { GuildItem } from "./models/guild-item";
import { PlayerErrorString } from "./utils";

export class PlayerConfig {
  private _store: Store<GuildItem>;
  private _client: Client;

  constructor(client: Client, store: Store<GuildItem>) {
    this._client = client;
    this._store = store;
  }

  async setPlayerChannel(guildId: string, channelId: string) {
    const state = this._store.get(guildId);
    if (!state) throw new Error(PlayerErrorString.init);
    state.config.playerChannels = new PlayerStateChannels(channelId, true);
    return await state._forceSync();
  }

  async setVoiceChannel(guildId: string, channelId: string) {
    const state = this._store.get(guildId);
    if (!state) throw new Error(PlayerErrorString.init);
    state.config.voiceChannel = new ConfigChannel(channelId, true);
    return await state._forceSync();
  }

  async setLogsChannel(guildId: string, channelId: string) {
    const state = this._store.get(guildId);
    if (!state) throw new Error(PlayerErrorString.init);
    state.config.logsChannel = new ConfigChannel(channelId, true);
    return await state._forceSync();
  }

  async newPlayerWithValue(
    guildId: string,
    textChannelId: string,
    logsChannelId: string
  ) {
    if (this._store.has(guildId)) return;
    const state = this._store.new(guildId);
    const guild = this._client.guilds.cache.get(guildId);
    if (guild) {
      await state.init({
        guild,
        client: this._client,
      });

      state.config.guildId = guildId;
      state.config.playerChannels = new PlayerStateChannels(
        textChannelId,
        true
      );
      state.config.logsChannel = new ConfigChannel(logsChannelId, true);
    }
    return await state._forceSync();
  }

  async newPlayer(guildId: string) {
    if (this._store.has(guildId)) return;
    const state = this._store.new(guildId);
    const guild = this._client.guilds.cache.get(guildId);
    if (guild) {
      await state.init({
        guild,
        client: this._client,
      });

      state.config.guildId = guildId;
    }
    return await state._forceSync();
  }

  has(guildId: string) {
    return this._store.has(guildId);
  }
}
