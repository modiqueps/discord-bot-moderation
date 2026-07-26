import {
  ActivityType,
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { BRAND_NAME } from "../config/constants.js";
import { getEnvironment } from "../config/environment.js";
import { connectDatabase } from "../database/connection.js";
import { loadCommands, loadEvents } from "./loaders.js";
import logger, { setLogLevel } from "./logger.js";

const commandsDirectory = new URL("../commands/", import.meta.url);
const eventsDirectory = new URL("../events/", import.meta.url);

export default class ModiquepsClient extends Client {
  constructor() {
    super({
      // GuildMembers is privileged and must be enabled in the developer
      // portal. It is required: the auto-role and member-goal features run off
      // guildMemberAdd / guildMemberRemove.
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
      partials: [Partials.GuildMember],
      presence: {
        activities: [
          {
            name: `${BRAND_NAME} is starting…`,
            type: ActivityType.Watching,
          },
        ],
        status: "online",
      },
    });

    /** @type {Collection<string, object>} */
    this.commands = new Collection();

    this.logger = logger;
  }

  /**
   * Load commands and events, connect to MongoDB, then log in.
   *
   * Ordering matters: everything is in place before the gateway connects, so
   * the bot is never online while still half-initialised.
   */
  async start() {
    const environment = getEnvironment();

    setLogLevel(environment.logLevel);
    this.environment = environment;

    await Promise.all([
      loadCommands(commandsDirectory, this.commands),
      loadEvents(this, eventsDirectory),
    ]);

    await connectDatabase(environment.mongoUri);
    await this.login(environment.token);

    return this;
  }
}
