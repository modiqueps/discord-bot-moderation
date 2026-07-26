import { Events } from "discord.js";
import commandHandler from "../handlers/commandHandler.js";

export const name = Events.InteractionCreate;

/**
 * @param {import("discord.js").Interaction} interaction
 */
export default function interactionCreate(interaction) {
  if (interaction.isChatInputCommand()) {
    return commandHandler(interaction);
  }
}
