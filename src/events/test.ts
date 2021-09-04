import EventBuilder from "@event-builder";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";

export default new EventBuilder({
  event: "messageCreate",
  async execute(message) {
    if (message.member?.user.bot) return;
  },
});
