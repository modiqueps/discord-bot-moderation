import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import ms from "ms";
import { MAX_TIMEOUT_MS } from "../../config/constants.js";
import { createStatusEmbed } from "../../util/embeds.js";
import { replyStatus } from "../../util/interaction.js";
import { validateModerationTarget } from "../../util/moderation.js";

const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription(
    "Temporarily restricts the selected member from communicating.",
  )
  .setContexts(InteractionContextType.Guild)
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The member to time out.")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("duration")
      .setDescription("Examples: 10m, 2h, 3d (maximum 28 days).")
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
  const durationInput = interaction.options.getString("duration", true);
  const reason =
    interaction.options.getString("reason") ?? "No reason provided.";
  const validationError = validateModerationTarget(
    interaction,
    member,
    "moderatable",
  );

  if (validationError) {
    await replyStatus(interaction, validationError, "error");
    return;
  }

  // ms() returns undefined for unparseable input rather than throwing.
  const duration = ms(durationInput);

  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > MAX_TIMEOUT_MS
  ) {
    await replyStatus(
      interaction,
      "Enter a valid duration, such as `10m`, `2h`, or `3d` (maximum 28 days).",
      "warning",
    );
    return;
  }

  await member.timeout(duration, reason);

  await interaction.reply({
    embeds: [
      createStatusEmbed(
        interaction,
        `**${member.user.username}** was timed out for **${durationInput}**.\n**Reason:** ${reason}`,
        "success",
      ),
    ],
  });
}

export default {
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  category: "Moderation",
  data,
  execute,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ModerateMembers],
};
