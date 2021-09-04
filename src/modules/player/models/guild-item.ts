import Client from "@modules/client";
import { Type } from "class-transformer";
import { Guild } from "discord.js";
import { Config } from "./config";
import { GuildPlayer } from "./player";

export interface GuildItemInitOptions {
  client: Client;
  guild: Guild;
}

export class GuildItem {
  @Type(() => Config)
  config!: Config;

  @Type(() => GuildPlayer)
  player!: GuildPlayer;

  async init(options: GuildItemInitOptions) {
    await this.player.init({
      guild: options.guild,
      client: options.client,
      config: this.config,
    });
  }
  constructor() {
    this.config = new Config();
    this.player = new GuildPlayer();
  }
}
