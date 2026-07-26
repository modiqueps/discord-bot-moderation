import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { createStatusEmbed } from "../../util/embeds.js";
import { replyStatus } from "../../util/interaction.js";
import {
  validateModerationTarget,
  validateRole,
} from "../../util/moderation.js";

const data = new SlashCommandBuilder()
  .setName("remove-role")
  .setDescription("Removes a role from the selected member.")
  .setContexts(InteractionContextType.Guild)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The member whose role will be removed.")
      .setRequired(true),
  )
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription("The role to remove.")
      .setRequired(true),
  );

async function execute(interaction) {
  const member = interaction.options.getMember("user");
  const role = interaction.options.getRole("role");
  const validationError =
    validateModerationTarget(interaction, member) ??
    validateRole(interaction, role);

  if (validationError) {
    await replyStatus(interaction, validationError, "error");
    return;
  }

  if (!member.roles.cache.has(role.id)) {
    await replyStatus(
      interaction,
      "The member does not have this role.",
      "warning",
    );
    return;
  }

  await member.roles.remove(
    role,
    `Action performed by ${interaction.user.tag}`,
  );

  await interaction.reply({
    embeds: [
      createStatusEmbed(
        interaction,
        `${role} was removed from **${member.user.username}**.`,
        "success",
      ),
    ],
  });
}

export default {
  botPermissions: [PermissionFlagsBits.ManageRoles],
  category: "Moderation",
  data,
  execute,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageRoles],
};
