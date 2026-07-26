import { PermissionsBitField } from "discord.js";
import logger from "../core/logger.js";
import { getRemainingCooldown } from "../util/cooldown.js";
import { replyStatus } from "../util/interaction.js";

/**
 * Names of the required permissions the holder is missing.
 *
 * `PermissionsBitField#missing` already resolves flags to names, so no reverse
 * lookup over the flag table is needed.
 *
 * @param {PermissionsBitField | null} granted
 * @param {bigint[]} [required]
 * @returns {string[]}
 */
function missingPermissionNames(granted, required = []) {
  if (required.length === 0) {
    return [];
  }

  if (!granted) {
    return new PermissionsBitField(required).toArray();
  }

  return granted.missing(required);
}

/**
 * Run a slash command after its guards and cooldown.
 *
 * Guards are checked before the cooldown deliberately: a command the user was
 * never allowed to run should not consume their cooldown.
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export default async function commandHandler(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    // Registered with Discord but no longer in the code.
    logger.warn(`Received unregistered command: /${interaction.commandName}`);
    return;
  }

  if (command.guildOnly && !interaction.inGuild()) {
    await replyStatus(
      interaction,
      "This command can only be used in a server.",
      "warning",
    );
    return;
  }

  const missingBotPermissions = missingPermissionNames(
    interaction.appPermissions,
    command.botPermissions,
  );

  if (missingBotPermissions.length > 0) {
    await replyStatus(
      interaction,
      `Missing bot permissions: \`${missingBotPermissions.join(", ")}\``,
      "error",
    );
    return;
  }

  const missingUserPermissions = missingPermissionNames(
    interaction.memberPermissions,
    command.userPermissions,
  );

  if (missingUserPermissions.length > 0) {
    await replyStatus(
      interaction,
      `You need the following permissions to use this command: \`${missingUserPermissions.join(", ")}\``,
      "error",
    );
    return;
  }

  const remainingCooldown = getRemainingCooldown(command, interaction.user.id);

  if (remainingCooldown > 0) {
    await replyStatus(
      interaction,
      `Wait ${remainingCooldown} seconds before using this command again.`,
      "warning",
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Command /${interaction.commandName} threw:`, error);

    // The interaction may already be unusable, so this must never throw again.
    await replyStatus(
      interaction,
      "An unexpected error occurred. Please try again later.",
      "error",
    ).catch((responseError) =>
      logger.error("Failed to send the command error response:", responseError),
    );
  }
}
