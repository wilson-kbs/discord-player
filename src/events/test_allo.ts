import { Interaction, Message } from "discord.js";
import EventBuilder from "@event-builder";

export default new EventBuilder({
  event: "messageDelete",
  async execute(message) {
    if (!message.guild) return;
    const fetchedLogs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: "MESSAGE_DELETE",
    });
    // Since there's only 1 audit log entry in this collection, grab the first one
    const deletionLog = fetchedLogs.entries.first();

    if (message instanceof Message && deletionLog) {
      if (!deletionLog && message instanceof Message)
        // Perform a coherence check to make sure that there's *something*
        return console.log(
          `A message by ${message?.author.tag} was deleted, but no relevant audit logs were found.`
        );

      // Now grab the user object of the person who deleted the message
      // Also grab the target of this action to double-check things
      const { executor, target } = deletionLog;

      // Update the output with a bit more information
      // Also run a check to make sure that the log returned was for the same author's message
      if ((target as any).id === message.author.id) {
        console.log(
          `A message by ${message?.author.tag} was deleted by ${executor?.tag}.`
        );
      } else {
        console.log(
          `A message by ${message.author.tag} was deleted, but we don't know by who.`
        );
      }
    }
  },
});

const toto = new EventBuilder({
  event: "messageCreate",
  async execute(man) {},
});
