import { MessageFlags } from "discord.js";
import { createStatusEmbed } from "./embeds.js";

/**
 * Reply to an interaction whatever state it is already in.
 *
 * `editReply` is only correct after a defer. Once a real reply has been sent,
 * editing it would overwrite what the user was already shown, so a follow-up
 * is sent instead.
 *
 * @param {import("discord.js").RepliableInteraction} interaction
 * @param {import("discord.js").InteractionReplyOptions} options
 */
export async function interactionResponse(interaction, options) {
  if (interaction.deferred) {
    // An edit cannot change visibility; flags would be rejected.
    const { flags, ...editable } = options;
    void flags;

    return interaction.editReply(editable);
  }

  if (interaction.replied) {
    return interaction.followUp(options);
  }

  return interaction.reply(options);
}

/**
 * Send a status embed that only the invoking user can see.
 *
 * This is the shape almost every guard and validation failure needs, so it is
 * expressed once rather than rebuilt at each call site.
 *
 * @param {import("discord.js").RepliableInteraction} interaction
 * @param {string} description
 * @param {"error" | "info" | "success" | "warning"} [type]
 */
export async function replyStatus(interaction, description, type = "info") {
  return interactionResponse(interaction, {
    embeds: [createStatusEmbed(interaction, description, type)],
    flags: MessageFlags.Ephemeral,
  });
}
