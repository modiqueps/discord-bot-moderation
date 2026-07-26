import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { createStatusEmbed } from "../../util/embeds.js";
import { replyStatus } from "../../util/interaction.js";
import { validateModerationTarget } from "../../util/moderation.js";

const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kicks the selected member from the server.")
  .setContexts(InteractionContextType.Guild)
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The member to kick.")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("The reason shown in the audit log.")
      .setMaxLength(512),
  );

async function execute(interaction) {
  const member = interaction.options.getMember("user");
  const reason =
    interaction.options.getString("reason") ?? "No reason provided.";
  const validationError = validateModerationTarget(
    interaction,
    member,
    "kickable",
  );

  if (validationError) {
    await replyStatus(interaction, validationError, "error");
    return;
  }

  await member.kick(reason);

  await interaction.reply({
    embeds: [
      createStatusEmbed(
        interaction,
        `**${member.user.username}** was kicked from the server.\n**Reason:** ${reason}`,
        "success",
      ),
    ],
  });
}

export default {
  botPermissions: [PermissionFlagsBits.KickMembers],
  category: "Moderation",
  data,
  execute,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.KickMembers],
};
