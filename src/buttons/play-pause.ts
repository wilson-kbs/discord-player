import ButtonBuilder from "@button-builder";

const BUTTON = new ButtonBuilder().setCustomId("play_pause");

// BUTTON RUNNING FUNCTION
BUTTON.setExecute(async function (interaction) {
  await interaction.deferReply({ ephemeral: false });
  try {
    const guildId = interaction.guildId;
    const guild = interaction.guild;
    if (!interaction.inGuild() || !guildId || !guild)
      throw new Error("La command ne peut se lancer que sur un serveur");

    const userIsInChannel = () => {
      const guildMember = guild.members.cache.get(interaction.user.id);
      if (!guildMember)
        throw new Error("je ne vous trouve pas sur le serveur!");
      if (!guildMember.voice.channel)
        throw new Error("vous devez rejoindre un channel vocal!");
      return true;
    };

    userIsInChannel();
    await this.player.Play_Pause(guildId, interaction);
  } catch (error) {
    console.error(error);
    const err = (error as any).message as string;
    const DMChannel = await interaction.user.createDM();
    DMChannel.send(err);
    if (interaction.deferred) await interaction.deleteReply();
  }
});

export default BUTTON;
