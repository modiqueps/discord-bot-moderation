import { EmbedBuilder } from "discord.js";
import { EMBED_COLORS } from "../config/constants.js";

const STYLES = {
  error: { color: EMBED_COLORS.error, icon: "❌", title: "Error" },
  info: { color: EMBED_COLORS.info, icon: "ℹ️", title: "Information" },
  success: { color: EMBED_COLORS.success, icon: "✅", title: "Success" },
  warning: { color: EMBED_COLORS.warning, icon: "⚠️", title: "Warning" },
};

/**
 * Build the standard status embed used for every result and error message.
 *
 * @param {import("discord.js").Interaction} interaction
 * @param {string} description
 * @param {"error" | "info" | "success" | "warning"} [type]
 */
export function createStatusEmbed(interaction, description, type = "info") {
  const style = STYLES[type] ?? STYLES.info;

  return new EmbedBuilder()
    .setColor(style.color)
    .setTitle(`${style.icon} ${style.title}`)
    .setDescription(description)
    .setFooter({
      iconURL: interaction.client.user.displayAvatarURL(),
      text: interaction.client.user.username,
    })
    .setTimestamp();
}
