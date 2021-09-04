import { MessageEmbed, MessageActionRow } from "discord.js";

export interface ResponseMessage {
  embeds: Array<MessageEmbed>;
  components: Array<MessageActionRow>;
}
