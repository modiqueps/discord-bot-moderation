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
  .setName("add-role")
  .setDescription("Adds a role to the selected member.")
  .setContexts(InteractionContextType.Guild)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The member who will receive the role.")
      .setRequired(true),
  )
  .addRoleOption((option) =>
    option.setName("role").setDescription("The role to add.").setRequired(true),
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

  if (member.roles.cache.has(role.id)) {
    await replyStatus(
      interaction,
      "The member already has this role.",
      "warning",
    );
    return;
  }

  await member.roles.add(role, `Action performed by ${interaction.user.tag}`);

  await interaction.reply({
    embeds: [
      createStatusEmbed(
        interaction,
        `${role} was added to **${member.user.username}**.`,
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
