/**
 * Check whether the actor may moderate the target.
 *
 * Returns a user-facing reason to refuse, or `null` when the action is allowed.
 * The server owner bypasses the hierarchy check because no role outranks them.
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {import("discord.js").GuildMember | null} target
 * @param {"bannable" | "kickable" | "manageable" | "moderatable"} [capability]
 * @returns {string | null}
 */
export function validateModerationTarget(
  interaction,
  target,
  capability = "manageable",
) {
  if (!target) {
    return "The selected member could not be found in this server.";
  }

  if (target.id === interaction.user.id) {
    return "You cannot perform this action on yourself.";
  }

  if (target.id === interaction.client.user.id) {
    return "You cannot perform this action on the bot.";
  }

  if (target.id === interaction.guild.ownerId) {
    return "Moderation actions cannot be performed on the server owner.";
  }

  const actorIsOwner = interaction.user.id === interaction.guild.ownerId;

  if (
    !actorIsOwner &&
    interaction.member.roles.highest.comparePositionTo(target.roles.highest) <=
      0
  ) {
    return "You cannot moderate a member whose highest role is equal to or higher than yours.";
  }

  if (!target[capability]) {
    return "The bot's role hierarchy or permissions are insufficient for this action.";
  }

  return null;
}

/**
 * Check whether a role may be assigned or removed by the actor.
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {import("discord.js").Role | null} role
 * @returns {string | null}
 */
export function validateRole(interaction, role) {
  if (!role || role.id === interaction.guild.id) {
    return "The @everyone role cannot be used for this action.";
  }

  if (role.managed) {
    return "Roles managed by integrations cannot be modified.";
  }

  const actorIsOwner = interaction.user.id === interaction.guild.ownerId;

  if (
    !actorIsOwner &&
    interaction.member.roles.highest.comparePositionTo(role) <= 0
  ) {
    return "You cannot manage a role that is equal to or higher than your highest role.";
  }

  if (interaction.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
    return "This role is equal to or higher than the bot's highest role.";
  }

  return null;
}

/**
 * Confirm the bot can post in a channel it has been pointed at.
 *
 * Channel overwrites beat guild-level permissions, so a bot that can post
 * everywhere else can still be denied here.
 *
 * @param {import("discord.js").GuildChannel} channel
 * @param {import("discord.js").Guild} guild
 * @param {bigint[]} required
 * @returns {boolean}
 */
export function canPostIn(channel, guild, required) {
  return Boolean(channel.permissionsFor(guild.members.me)?.has(required));
}
