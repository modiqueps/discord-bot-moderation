# Modique Project Studios Discord Moderation

An open-source moderation bot for Discord servers: slash commands with role hierarchy checks, automatic roles, member-goal tracking, cooldowns, MongoDB persistence, and optional sharding.

Maintained by [Modique Project Studios](https://github.com/modiqueps).

## Features

- Safe ban, kick, timeout, and role-management commands
- User and bot permission checks before a command runs
- Server-owner, member, and bot role hierarchy validation
- Automatic roles with customizable welcome messages
- Member-goal tracking with join and leave notifications
- Stale configuration self-heals when a saved channel or role is deleted
- Interactive, category-based help menu
- Global or development-server command registration
- Single-process by default, with sharding available when you need it
- Managed MongoDB connection lifecycle and graceful shutdown
- Levelled logging with timestamps and shard tags
- ESLint, Prettier, Node.js tests, GitHub Actions, and Dependabot
- Docker support

## Commands

| Command        | Description                        | Required user permission |
| -------------- | ---------------------------------- | ------------------------ |
| `/help`        | Lists commands by category         | None                     |
| `/ping`        | Shows bot and Discord API latency  | None                     |
| `/ban`         | Bans a member from the server      | Ban Members              |
| `/kick`        | Kicks a member from the server     | Kick Members             |
| `/timeout`     | Applies a timeout of up to 28 days | Moderate Members         |
| `/add-role`    | Adds a role to a member            | Manage Roles             |
| `/remove-role` | Removes a role from a member       | Manage Roles             |
| `/auto-role`   | Manages automatic role assignment  | Manage Roles             |
| `/member-goal` | Manages the server member goal     | Manage Server            |

## Requirements

- Node.js `20.19.0` or later
- npm
- MongoDB, or a MongoDB Atlas connection
- A bot created in the Discord Developer Portal

Enable **Server Members Intent** on the bot page — the automatic role and member-goal features depend on it. When installing the application, select the `bot` and `applications.commands` scopes, and grant the permissions the features you plan to use require: `Manage Roles`, `Ban Members`, `Kick Members`, `Moderate Members`, `View Channels`, and `Send Messages`.

## Installation

```bash
git clone https://github.com/modiqueps/discord-bot-moderation.git
cd discord-bot-moderation
npm ci
cp .env.example .env
```

On Windows PowerShell, replace the final command with:

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```dotenv
TOKEN=discord_bot_token
MONGO_URI=mongodb://127.0.0.1:27017/modiqueps
GUILD_ID=
```

`GUILD_ID` is optional but worth setting during development: commands registered to one server appear immediately, while global commands can take up to an hour to propagate. Leave it empty in production.

Start the bot:

```bash
npm start
```

The bot refuses to start when a required variable is missing, and names which one.

## Scripts

| Command         | What it does                      |
| --------------- | --------------------------------- |
| `npm start`     | Run the bot in a single process   |
| `npm run dev`   | Same, restarting on file changes  |
| `npm run shard` | Run under a sharding manager      |
| `npm run check` | Lint, formatting check, and tests |
| `npm test`      | Tests only                        |

## Configuration

| Variable      | Required | Description                                                         |
| ------------- | -------- | ------------------------------------------------------------------- |
| `TOKEN`       | yes      | Bot token from the Discord Developer Portal                         |
| `MONGO_URI`   | yes      | MongoDB connection string                                           |
| `GUILD_ID`    | no       | Register commands to this server only; updates are instant          |
| `LOG_LEVEL`   | no       | `debug`, `info` (default), `warn`, `error`, or `silent`             |
| `SHARD_COUNT` | no       | Shard count for `npm run shard`; `auto` (default) lets Discord pick |

## Sharding

Discord only requires sharding past 2500 guilds, so `npm start` runs a single process — less memory, easier to debug. When you outgrow it:

```bash
npm run shard
```

Point your process manager at `src/shard.js` instead of `src/index.js`. Command registration is guarded so only shard 0 performs it.

## Quality checks

```bash
npm run check
```

Runs linting, formatting checks, and tests. GitHub Actions runs the same command on pushes to `main` and on pull requests.

## Docker

Prepare `.env`, then run:

```bash
docker build -t modiqueps .
docker run --env-file .env --restart unless-stopped modiqueps
```

If MongoDB runs outside Docker on the same machine, use the host address your operating system provides rather than `localhost`.

## Project structure

```text
src/
├── commands/             Slash commands, grouped by category
│   ├── general/
│   └── moderation/
├── config/               Constants and environment validation
├── core/                 Client, module loaders, logger
├── database/             MongoDB connection and models
├── events/               Gateway event listeners
├── handlers/             Interaction routing
├── util/                 Shared moderation and interaction helpers
├── index.js              Entry point — single process
└── shard.js              Entry point — sharding manager
```

Commands and events are discovered by walking their folders, so a new file is picked up on the next start with nothing to register by hand.

## Adding a command

Drop a file under `src/commands/<category>/`:

```js
import { InteractionContextType, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("example")
  .setDescription("An example command.")
  .setContexts(InteractionContextType.Guild);

async function execute(interaction) {
  await interaction.reply("Hello!");
}

export default {
  category: "Moderation",
  data,
  execute,
  guildOnly: true,
  userPermissions: [],
};
```

Optional fields: `cooldown` (seconds, or `false` to disable), `guildOnly`, `userPermissions`, `botPermissions`, and `category`.

## Security

`.env` is excluded from Git. If a token or database password was ever committed, deleting the file is not enough — the secret remains in the repository history, so rotate the credential immediately. See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a change. This project is licensed under [GNU GPL v3](LICENSE).
