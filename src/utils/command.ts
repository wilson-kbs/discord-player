import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Core } from "@core";

export type ExecCommandFunction = (
  this: Core,
  interaction: CommandInteraction
) => Promise<void>;

export class CommandBuilder extends SlashCommandBuilder {
  private _exec!: ExecCommandFunction;

  constructor() {
    super();
  }

  /** @readonly */
  get execute() {
    if (!this._exec)
      throw new Error(`execute is not define on Command ${this.name}`);
    return this._exec;
  }

  setExecute(exec: ExecCommandFunction) {
    this._exec = exec;
    return this;
  }
}

export default CommandBuilder;
