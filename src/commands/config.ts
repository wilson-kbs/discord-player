import Command from "@command-builder";

const COMMAND = new Command();

// DEFINE COMMANDS
COMMAND.setName("music_config").setDescription("Test config music bot");

// DEFINE SUB_COMMANDS
COMMAND.addSubcommand((subcommand) =>
  subcommand
    .setName("init")
    .setDescription("Initialisation des paramètre du serveur")
    .addChannelOption((option) =>
      option
        .setName("player_channel")
        .setDescription(`Channel d'affichage du player`)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("logs_channel")
        .setDescription(`Channel de logs <TEXT CHANNEL>`)
        .setRequired(false)
    )
);

// DEFINE SUB_COMMANDS_GROUPS
// COMMAND.addSubcommandGroup((group) =>
//   group
//     .setName("manage")
//     .setDescription("Shows or manages points in the server")
//     .addSubcommand((subcommand) =>
//       subcommand.setName("config").setDescription("Test Config")
//     )
// );

// DEFINE EXECUTE FUNCTION COMMAND
COMMAND.setExecute(async function (interaction) {
  const guildId = interaction.guildId;
  const guild = interaction.guild;
  if (!guildId || !guild)
    return interaction.reply("La command ne peut se lancer que sur un serveur");

  const PLAYER_CONFIG = this.player.config;

  const SUBCOMMAND_NAME = interaction.options.getSubcommand();

  try {
    if (SUBCOMMAND_NAME == "init") {
      if (PLAYER_CONFIG.has(guildId))
        throw new Error("Le serveur est déjà initialiser !");

      const PLAYER_CHANNEL = interaction.options.getChannel(
        "player_channel",
        false
      );
      const LOGS_CHANNEL = interaction.options.getChannel(
        "logs_channel",
        false
      );

      // CHECK INIT VALUES
      if (
        PLAYER_CHANNEL &&
        (PLAYER_CHANNEL?.type != "GUILD_TEXT" || !PLAYER_CHANNEL.isText())
      )
        throw new Error("Le player channel doit être de type TEXT");

      if (
        LOGS_CHANNEL &&
        (LOGS_CHANNEL?.type != "GUILD_TEXT" || !LOGS_CHANNEL.isText())
      )
        throw new Error("Le player channel doit être de type TEXT");

      // CREATE NEW PLAYER_STATE
      if (PLAYER_CHANNEL && LOGS_CHANNEL) {
        await PLAYER_CONFIG.newPlayerWithValue(
          guildId,
          PLAYER_CHANNEL.id,
          LOGS_CHANNEL.id
        );
      } else {
        if (!(await PLAYER_CONFIG.newPlayer(guildId)))
          throw new Error("Erreur lors de l'initialisation du Player");
        if (PLAYER_CHANNEL) {
          await PLAYER_CONFIG.setPlayerChannel(guildId, PLAYER_CHANNEL.id);
        } else if (LOGS_CHANNEL) {
          await PLAYER_CONFIG.setPlayerChannel(guildId, LOGS_CHANNEL.id);
        }
      }

      return interaction.reply({
        content: "Votre serveur a été initialiser!",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(error);

    const err = error as Error;

    interaction.reply({
      content: err.message,
      ephemeral: true,
    });
  }
});

export default COMMAND;
