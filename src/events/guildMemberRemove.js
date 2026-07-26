import { Events } from "discord.js";
import logger from "../core/logger.js";
import guildModel from "../database/guildModel.js";
import { resolveCounterChannel } from "../util/guildConfig.js";

export const name = Events.GuildMemberRemove;

/**
 * @param {import("discord.js").GuildMember} member
 */
export default async function guildMemberRemove(member) {
  try {
    const guildData = await guildModel
      .findOne({ guildID: member.guild.id })
      .lean();

    const channel = await resolveCounterChannel(
      member.guild,
      guildData?.counterConfig,
    );

    if (!channel) {
      return;
    }

    const remaining = Math.max(
      guildData.counterConfig.count - member.guild.memberCount,
      0,
    );

    await channel.send({
      content: `👋 ${member.user.username} left the server. We now have **${member.guild.memberCount} members**; **${remaining}** remain until the goal.`,
    });
  } catch (error) {
    logger.error(`[guildMemberRemove:${member.guild.id}]`, error);
  }
}
