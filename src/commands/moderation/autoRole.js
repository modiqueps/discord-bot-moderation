import {
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { DEFAULT_AUTO_ROLE_MESSAGE } from "../../config/constants.js";
import guildModel from "../../database/guildModel.js";
import { createStatusEmbed } from "../../util/embeds.js";
import { replyStatus } from "../../util/interaction.js";
import { canPostIn, validateRole } from "../../util/moderation.js";

const REQUIRED_CHANNEL_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
];

const data = new SlashCommandBuilder()
  .setName("auto-role")
  .setDescription("Automatically assigns a role to new members.")
  .setContexts(InteractionContextType.Guild)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("configure")
      .setDescription("Configures the automatic role system.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel for welcome messages.")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("The role assigned to new members.")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription(
            "The welcome message. Use {user} to mention the member.",
          )
          .setMaxLength(1_800),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("settings")
      .setDescription("Shows the current automatic role settings."),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset")
      .setDescription("Disables the automatic role system."),
  );

async function configure(interaction) {
  const channel = interaction.options.getChannel("channel", true);
  const role = interaction.options.getRole("role", true);
  const message =
    interaction.options.getString("message") ?? DEFAULT_AUTO_ROLE_MESSAGE;

  const roleError = validateRole(interaction, role);

  if (roleError) {
    await replyStatus(interaction, roleError, "error");
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
    {
      $set: {
        autoRoleConfig: { channel: channel.id, message, role: role.id },
      },
    },
    { upsert: true },
  );

  await interaction.reply({
    embeds: [
      createStatusEmbed(
        interaction,
        `Automatic role configured.\n**Channel:** ${channel}\n**Role:** ${role}\n**Message:** ${message}`,
        "success",
      ),
    ],
  });
}

async function showSettings(interaction) {
  const guildData = await guildModel
    .findOne({ guildID: interaction.guild.id })
    .lean();
  const config = guildData?.autoRoleConfig;

  if (!config?.channel || !config?.role) {
    await replyStatus(
      interaction,
      "The automatic role system has not been configured.",
      "info",
    );
    return;
  }

  await replyStatus(
    interaction,
    `**Channel:** <#${config.channel}>\n**Role:** <@&${config.role}>\n**Message:** ${config.message}`,
    "info",
  );
}

async function reset(interaction) {
  const result = await guildModel.updateOne(
    { autoRoleConfig: { $exists: true }, guildID: interaction.guild.id },
    { $unset: { autoRoleConfig: 1 } },
  );

  const wasEnabled = result.modifiedCount > 0;

  await replyStatus(
    interaction,
    wasEnabled
      ? "The automatic role system has been disabled."
      : "The automatic role system is already disabled.",
    wasEnabled ? "success" : "info",
  );
}

const SUBCOMMANDS = { configure, reset, settings: showSettings };

async function execute(interaction) {
  await SUBCOMMANDS[interaction.options.getSubcommand()](interaction);
}

export default {
  botPermissions: [PermissionFlagsBits.ManageRoles],
  category: "Moderation",
  data,
  execute,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageRoles],
};
