import Command from "@command-builder";

const COMMAND = new Command();

// ## DEFINE COMMANDS
COMMAND.setName("music").setDescription("Music Bot Player");

// ## DEFINE EXECUTE FUNCTION COMMAND

COMMAND.addSubcommand((subcommand) =>
  subcommand.setName("player").setDescription("Show Music Player")
)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("play")
      .setDescription("Play Music")
      .addIntegerOption((input) =>
        input
          .setName("track_id")
          .setDescription("Track ID in Playlist")
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("pause").setDescription("Pause Music")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("stop").setDescription("Stop Music")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("prev").setDescription("Previous Track")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("next").setDescription("Next Track")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Add Music or Playlist Youtube on Playlist")
      .addStringOption((input) =>
        input
          .setName("youtube_url")
          .setDescription("Youtube URL")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("Remove Track on Playlist")
      .addIntegerOption((input) =>
        input
          .setName("track_id")
          .setDescription("Track ID in Playlist")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("vol")
      .setDescription("Change Volume State")
      .addIntegerOption((input) =>
        input.setName("value").setDescription("1 - 100").setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("playlist").setDescription("Show Playlist")
  );

// Function Command
COMMAND.setExecute(async function (interaction) {
  await interaction.deferReply({ ephemeral: false });

  try {
    const guildId = interaction.guildId;
    const guild = interaction.guild;
    if (!interaction.inGuild() || !guildId || !guild)
      throw new Error("La command ne peut se lancer que sur un serveur");

    const SubCommandName = interaction.options.getSubcommand();

    const Player = this.player;

    switch (SubCommandName) {
      case "player":
        const channelId = await Player.showPlayer(
          guildId,
          interaction.channelId
        );
        let contenteReplyMessage = "";
        if (channelId == interaction.channelId) {
          await interaction.deleteReply();
          return;
        } else contenteReplyMessage = `Le Player se trouve dans <#${channelId}>`;
        await interaction
          .editReply({
            content: contenteReplyMessage,
          })
          .catch(console.error);
        break;
      case "add":
        await Player.Add(guildId, interaction);
    }
  } catch (error) {
    console.error(error);
    const err = (error as any).message as string;
    const DMChannel = await interaction.user.createDM();
    DMChannel.send(err);
    if (interaction.deferred) await interaction.deleteReply();
  }
});

export default COMMAND;
