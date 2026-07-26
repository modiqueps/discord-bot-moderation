export const BRAND_NAME = "ModiQuePS";

export const DEFAULT_COOLDOWN_SECONDS = 5;

export const DEFAULT_AUTO_ROLE_MESSAGE =
  "Welcome {user}, your automatic role has been assigned.";

/** Discord refuses timeouts longer than 28 days. */
export const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1_000;

/** How often the presence line is refreshed. */
export const PRESENCE_REFRESH_MS = 120_000;

export const EMBED_COLORS = {
  brand: 0x5865f2,
  error: 0xed4245,
  info: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
};
