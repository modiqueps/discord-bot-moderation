import { DEFAULT_COOLDOWN_SECONDS } from "../config/constants.js";

const cooldowns = new Map();

/**
 * Per-user, per-command rate limit.
 *
 * Set `cooldown: false` on a command to opt out, or a number of seconds to
 * override the default.
 *
 * @param {object} command
 * @param {string} userId
 * @param {number} [now]
 * @returns {number} seconds remaining, or 0 when the command may run
 */
export function getRemainingCooldown(command, userId, now = Date.now()) {
  if (command.cooldown === false) {
    return 0;
  }

  const duration = (command.cooldown ?? DEFAULT_COOLDOWN_SECONDS) * 1_000;
  const key = `${command.data.name}:${userId}`;
  const expiresAt = cooldowns.get(key) ?? 0;

  if (expiresAt > now) {
    return Math.ceil((expiresAt - now) / 100) / 10;
  }

  cooldowns.set(key, now + duration);

  // unref so a pending cooldown never holds the process open during shutdown.
  const timer = setTimeout(() => cooldowns.delete(key), duration);
  timer.unref?.();

  return 0;
}

export function clearCooldowns() {
  cooldowns.clear();
}
