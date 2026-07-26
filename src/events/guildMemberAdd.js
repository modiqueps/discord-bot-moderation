import { Events } from "discord.js";
import { BRAND_NAME, DEFAULT_AUTO_ROLE_MESSAGE } from "../config/constants.js";
import logger from "../core/logger.js";
import guildModel from "../database/guildModel.js";
import {
  resolveAutoRoleTargets,
  resolveCounterChannel,
} from "../util/guildConfig.js";

export const name = Events.GuildMemberAdd;

async function applyAutoRole(member, config) {
  const targets = await resolveAutoRoleTargets(member.guild, config);

  if (!targets) {
    return;
  }

  await member.roles.add(targets.role, `${BRAND_NAME} automatic role system`);

  const message = config.message || DEFAULT_AUTO_ROLE_MESSAGE;
  await targets.channel.send({
    content: `👋 ${message.replaceAll("{user}", `${member}`)}`,
  });
}

async function updateCounter(member, config) {
  const channel = await resolveCounterChannel(member.guild, config);

  if (!channel) {
    return;
  }

  if (member.guild.memberCount >= config.count) {
    await channel.send({
      content: `🎉 ${member} joined the server. The **${config.count}-member** goal has been reached!`,
    });

    await guildModel.updateOne(
      { guildID: member.guild.id },
      { $unset: { counterConfig: 1 } },
    );
    return;
  }

  const remaining = config.count - member.guild.memberCount;
  await channel.send({
    content: `👋 ${member} joined the server. We now have **${member.guild.memberCount} members**; **${remaining}** remain until the goal.`,
  });
}

/**
 * @param {import("discord.js").GuildMember} member
 */
export default async function guildMemberAdd(member) {
  try {
    const guildData = await guildModel
      .findOne({ guildID: member.guild.id })
      .lean();

    if (!guildData) {
      return;
    }

    // Settled rather than all: a failing auto-role must not stop the counter.
    const results = await Promise.allSettled([
      applyAutoRole(member, guildData.autoRoleConfig),
      updateCounter(member, guildData.counterConfig),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        logger.error(`[guildMemberAdd:${member.guild.id}]`, result.reason);
      }
    }
  } catch (error) {
    logger.error(
      `[guildMemberAdd:${member.guild.id}] Failed to read the guild settings:`,
      error,
    );
  }
}
