import { SlashCommandBuilder } from "discord.js";
import { createStatusEmbed } from "../../util/embeds.js";

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Shows the bot and Discord API latency.");

async function execute(interaction) {
  const startedAt = Date.now();
  await interaction.deferReply();
  const roundTrip = Date.now() - startedAt;

  await interaction.editReply({
    embeds: [
      createStatusEmbed(
        interaction,
        `**Bot latency:** ${roundTrip} ms\n**Discord API:** ${Math.round(interaction.client.ws.ping)} ms`,
      ),
    ],
  });
}

export default {
  category: "General",
  cooldown: 2,
  data,
  execute,
};
