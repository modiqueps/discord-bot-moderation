import {
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import guildModel from "../../database/guildModel.js";
import { createStatusEmbed } from "../../util/embeds.js";
import { replyStatus } from "../../util/interaction.js";
import { canPostIn } from "../../util/moderation.js";

const REQUIRED_CHANNEL_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
];

const data = new SlashCommandBuilder()
  .setName("member-goal")
  .setDescription("Tracks a member-count goal for the server.")
  .setContexts(InteractionContextType.Guild)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("configure")
      .setDescription("Configures the member goal and notification channel.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel for member activity notifications.")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        option
          .setName("target")
          .setDescription("The target member count.")
          .setMinValue(1)
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("settings")
      .setDescription("Shows the current member goal settings."),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset")
      .setDescription("Disables the member goal system."),
  );

async function configure(interaction) {
  const channel = interaction.options.getChannel("channel", true);
  const count = interaction.options.getInteger("target", true);

  if (count <= interaction.guild.memberCount) {
    await replyStatus(
      interaction,
      `The target must be greater than the current member count (${interaction.guild.memberCount}).`,
      "warning",
    );
    return;
  }

  if (!canPostIn(channel, interaction.guild, REQUIRED_CHANNEL_PERMISSIONS)) {
    await replyStatus(
      interaction,
      "I need the `ViewChannel` and `SendMessages` permissions in the selected channel.",
      "error",
    );
    return;
  }

  await guildModel.updateOne(
    { guildID: interaction.guild.id },
    { $set: { counterConfig: { channel: channel.id, count } } },
    { upsert: true },
  );

  await interaction.reply({
    embeds: [
      createStatusEmbed(
        interaction,
        `Member goal configured.\n**Channel:** ${channel}\n**Target:** ${count}`,
        "success",
      ),
    ],
  });
}

async function showSettings(interaction) {
  const guildData = await guildModel
    .findOne({ guildID: interaction.guild.id })
    .lean();
  const config = guildData?.counterConfig;

  if (!config?.channel || !config?.count) {
    await replyStatus(
      interaction,
      "The member goal system has not been configured.",
      "info",
    );
    return;
  }

  const remaining = Math.max(config.count - interaction.guild.memberCount, 0);

  await replyStatus(
    interaction,
    `**Channel:** <#${config.channel}>\n**Target:** ${config.count}\n**Remaining:** ${remaining}`,
    "info",
  );
}

async function reset(interaction) {
  const result = await guildModel.updateOne(
    { counterConfig: { $exists: true }, guildID: interaction.guild.id },
    { $unset: { counterConfig: 1 } },
  );

  const wasEnabled = result.modifiedCount > 0;

  await replyStatus(
    interaction,
    wasEnabled
      ? "The member goal system has been disabled."
      : "The member goal system is already disabled.",
    wasEnabled ? "success" : "info",
  );
}

const SUBCOMMANDS = { configure, reset, settings: showSettings };

async function execute(interaction) {
  await SUBCOMMANDS[interaction.options.getSubcommand()](interaction);
}

export default {
  category: "Moderation",
  data,
  execute,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
};
