import {
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { BRAND_NAME, EMBED_COLORS } from "../../config/constants.js";
import logger from "../../core/logger.js";

const MENU_TIMEOUT_MS = 120_000;

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Lists the available commands by category.");

function createCategoryEmbed(interaction, category) {
  const commandList = interaction.client.commands
    .filter((command) => command.category === category)
    .map((command) => `**/${command.data.name}** — ${command.data.description}`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(EMBED_COLORS.brand)
    .setTitle(`${BRAND_NAME} • ${category}`)
    .setDescription(commandList || "There are no commands in this category.")
    .setFooter({
      iconURL: interaction.user.displayAvatarURL(),
      text: `Requested by ${interaction.user.username}`,
    })
    .setTimestamp();
}

async function execute(interaction) {
  const categories = [
    ...new Set(
      interaction.client.commands
        .map((command) => command.category)
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right, "en"));

  // The interaction id keeps this menu distinct from any other open help menu.
  const customId = `help:${interaction.id}`;

  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder("Select a category…")
    .addOptions(
      categories.map((category) => ({
        description: `View ${category.toLowerCase()} commands`,
        label: category,
        value: category,
      })),
    );

  const overview = new EmbedBuilder()
    .setColor(EMBED_COLORS.brand)
    .setTitle(`${BRAND_NAME} • Help`)
    .setDescription(
      `Safe and straightforward Discord moderation.\n\nSelect a category to browse **${interaction.client.commands.size} commands**.`,
    )
    .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
    .setFooter({
      iconURL: interaction.user.displayAvatarURL(),
      text: `Requested by ${interaction.user.username}`,
    })
    .setTimestamp();

  const message = await interaction.reply({
    components: [new ActionRowBuilder().addComponents(menu)],
    embeds: [overview],
    flags: MessageFlags.Ephemeral,
    withResponse: true,
  });

  const collector = message.resource.message.createMessageComponentCollector({
    filter: (componentInteraction) =>
      componentInteraction.customId === customId &&
      componentInteraction.user.id === interaction.user.id,
    time: MENU_TIMEOUT_MS,
  });

  collector.on("collect", async (componentInteraction) => {
    await componentInteraction
      .update({
        embeds: [
          createCategoryEmbed(interaction, componentInteraction.values[0]),
        ],
      })
      .catch((error) => logger.error("Failed to update the help menu:", error));
  });

  collector.on("end", async () => {
    // The ephemeral reply may be gone by now; a failure here is not actionable.
    await interaction
      .editReply({
        components: [
          new ActionRowBuilder().addComponents(
            StringSelectMenuBuilder.from(menu).setDisabled(true),
          ),
        ],
      })
      .catch(() => {});
  });
}

export default {
  category: "General",
  cooldown: 2,
  data,
  execute,
};
