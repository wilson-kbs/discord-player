import {
  Client as DiscordClient,
  ClientOptions,
  Collection,
  Interaction,
} from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

import ButtonBuilder, { ExecButtonFunction } from "@button-builder";
import CommandBuilder, { ExecCommandFunction } from "@command-builder";
import EventBuilder, { ExecEventFunction } from "@event-builder";

type InteractionEventFunction = (interaction: Interaction) => Promise<void>;

export class Client extends DiscordClient {
  _commands: Collection<string, ExecCommandFunction>;
  _buttons: Collection<string, ExecButtonFunction>;
  _events: Collection<string, ExecEventFunction>;

  constructor(options: ClientOptions) {
    super(options);
    this._commands = new Collection();
    this._buttons = new Collection();
    this._events = new Collection();

    this.on("ready", () => {
      if (this.user) console.log(`Logged in as ${this.user.tag}!`);
    });

    this.init();
  }
  async registerSlashCommands(commands: Array<CommandBuilder>, token: string) {
    this.on("ready", async () => {
      // register command Slash
      if (commands.length > 0 && this.user) {
        const clientID = this.user.id;
        const guildID = "360675076783341570";

        const rest = new REST({ version: "9" }).setToken(token);
        const commandsJSON = commands.map((command) => command.toJSON());
        try {
          await rest.put(Routes.applicationGuildCommands(clientID, guildID), {
            body: commandsJSON,
          });

          console.log("Successfully reloaded application (/) commands.");
        } catch (error) {
          console.error(error);
          throw error;
        }
      }
    });
  }

  addSlashCommands(commands: Array<CommandBuilder>) {
    commands.forEach((item) => {
      this._commands.set(item.name, item.execute);
    });
  }

  addButton(buttonsBuilder: Array<ButtonBuilder>) {
    buttonsBuilder.forEach((item) => {
      this._buttons.set(item.customId, item.execute);
    });
  }

  addEvents(events: Array<EventBuilder<any>>) {
    events.forEach((item) => {
      this.on(item.event, item.execute);
    });
  }

  private init() {
    // SLASH COMMAND
    this.on("interactionCreate", async (interaction) => {
      let execute: InteractionEventFunction | null = null;

      if (interaction.isCommand())
        execute = this._commands.get(
          interaction.commandName
        ) as InteractionEventFunction;

      if (interaction.isButton())
        execute = this._buttons.get(
          interaction.customId
        ) as InteractionEventFunction;

      if (!execute) return;

      try {
        await execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.isCommand() || interaction.isButton())
          await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
      }
    });
  }
}

export default Client;
