# Contributing

Contributions are welcome. Before starting a substantial change, open an issue that briefly describes the goal and expected behavior.

## Development workflow

1. Fork the repository and create a branch for your change.
2. Copy `.env.example` to `.env`.
3. Install dependencies with `npm ci`.
4. Create small, focused commits.
5. Make sure `npm run check` passes.
6. Open a pull request that explains the behavior and how it was tested.

New commands belong under `src/Commands`. Each command module must provide a default export containing a `SlashCommandBuilder` and an `execute` function. Never commit secrets, bot tokens, or production MongoDB connection strings.
