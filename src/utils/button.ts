import { ButtonInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Core } from "@core";

export type ExecButtonFunction = (
  this: Core,
  interaction: ButtonInteraction
) => Promise<void>;

export class ButtonBuilder {
  private _id!: string;
  private _exec!: ExecButtonFunction;

  /** @readonly */
  get customId() {
    return this._id;
  }

  /** @readonly */
  get execute() {
    if (!this._exec)
      throw new Error(`Execute is not define on Button ${this._id}`);
    return this._exec;
  }

  setCustomId(customId: string) {
    this._id = customId;
    return this;
  }

  setExecute(exec: ExecButtonFunction) {
    this._exec = exec;
    return this;
  }
}

export default ButtonBuilder;
