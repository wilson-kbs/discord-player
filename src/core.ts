import { ClientOptions, Collection, Intents } from "discord.js";
import { readdirSync } from "fs";
import path = require("path/posix");

import Client from "@modules/client";
import { Player as DiscordPlayer } from "@modules/player";

import ButtonBuilder from "@button-builder";
import CommandBuilder from "@command-builder";
import EventBuilder from "@event-builder";

interface CoreOptions {
  client?: Client;
  player?: DiscordPlayer;
}

export class Core {
  private _client: Client;
  private _player: DiscordPlayer;

  private _appIsStart = false;

  constructor(options?: CoreOptions) {
    if (!process.env.TOKEN)
      throw new Error("Token is undefined, please set Discord Token on .env");

    // Set default Client if he is not found in options
    this._client =
      options?.client ??
      new Client({
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MEMBERS,
        ],
      });

    // Set default Plyaer if he is not found in options
    this._player = options?.player ?? new DiscordPlayer(this._client);
  }

  /** @readonly */
  get client() {
    return this._client;
  }

  /** @readonly */
  get player() {
    return this._player;
  }

  async start() {
    if (!this._appIsStart) {
      if (!process.env.TOKEN)
        throw new Error("Token is undefined, please set Discord Token on .env");

      const DISCORD_EVENTS = await getFiles("events");
      this._client.addEvents(
        DISCORD_EVENTS.map((item) => item.setExecute(item.execute.bind(this)))
      );

      const DISCORD_BUTTONS = await getFiles("button");
      this._client.addButton(
        DISCORD_BUTTONS.map((item) => item.setExecute(item.execute.bind(this)))
      );

      const DISCORD_COMMANDS = await getFiles("commands");
      this._client.addSlashCommands(
        DISCORD_COMMANDS.map((item) => item.setExecute(item.execute.bind(this)))
      );

      this._client.registerSlashCommands(DISCORD_COMMANDS, process.env.TOKEN);

      // const COMMAND_COLLECTION: Collection<string, Function> = new Collection();
      // DISCORD_COMMANDS.forEach((item) => {
      //   COMMAND_COLLECTION.set(item.name, item.execute.bind(this));
      // });

      await this._player.init();

      this._client.login(process.env.TOKEN);

      this._appIsStart = true;
    }
  }
}

interface FilesType {
  events: Array<EventBuilder<any>>;
  commands: Array<CommandBuilder>;
  button: Array<ButtonBuilder>;
}

const DIR_NAME = {
  events: "./events",
  commands: "./commands",
  button: "./buttons",
};

async function getFiles<K extends keyof FilesType>(
  files: K
): Promise<FilesType[K]> {
  const DIR_PATH = path.join(__dirname, DIR_NAME[files]);
  const commandFiles = readdirSync(DIR_PATH).filter((file) =>
    file.endsWith(".js")
  );

  const commands: FilesType[K] = await Promise.all(
    commandFiles.map(async (file: string) => {
      return await import(path.join(DIR_PATH, file)).then(
        (res: any) => res.default
      );
    })
  );
  return commands;
}

export default Core;
