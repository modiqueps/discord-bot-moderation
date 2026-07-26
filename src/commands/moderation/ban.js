import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { createStatusEmbed } from "../../util/embeds.js";
import { replyStatus } from "../../util/interaction.js";
import { validateModerationTarget } from "../../util/moderation.js";

const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Bans the selected member from the server.")
  .setContexts(InteractionContextType.Guild)
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The member to ban.")
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
    "bannable",
  );

  if (validationError) {
    await replyStatus(interaction, validationError, "error");
    return;
  }

  await member.ban({ reason });

  await interaction.reply({
    embeds: [
      createStatusEmbed(
        interaction,
        `**${member.user.username}** was banned from the server.\n**Reason:** ${reason}`,
        "success",
      ),
    ],
  });
}

export default {
  botPermissions: [PermissionFlagsBits.BanMembers],
  category: "Moderation",
  data,
  execute,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.BanMembers],
};
