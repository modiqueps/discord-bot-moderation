import { Events } from "discord.js";
import logger from "../core/logger.js";

/**
 * discord.js emits `error` for gateway and REST failures it has already
 * handled. Without a listener these reach the default unhandled-error path.
 */
export const name = Events.Error;

export default function error(clientError) {
  logger.error("Client error:", clientError);
}
