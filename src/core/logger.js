const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

// Built from a char code rather than an inline escape so the source carries no
// raw control characters, which editors and diff viewers tend to mangle.
const ESC = String.fromCharCode(27);

const COLOR = {
  debug: `${ESC}[90m`,
  error: `${ESC}[31m`,
  info: `${ESC}[36m`,
  success: `${ESC}[32m`,
  warn: `${ESC}[33m`,
};

const RESET = `${ESC}[0m`;
const DIM = `${ESC}[2m`;

/** Set by discord.js when this process was spawned by a ShardingManager. */
const shardIds = process.env.SHARDS;

let threshold = LEVELS.info;

/**
 * Raise or lower the level after the environment has been read. Anything below
 * the threshold is dropped.
 *
 * @param {"debug" | "info" | "warn" | "error" | "silent"} level
 */
export function setLogLevel(level) {
  threshold = LEVELS[level] ?? LEVELS.info;
}

function write(level, label, args) {
  if (LEVELS[level] < threshold) {
    return;
  }

  const timestamp = new Date().toISOString().slice(11, 19);
  const scope =
    shardIds === undefined ? "" : ` ${DIM}[shard ${shardIds}]${RESET}`;
  const tag = `${COLOR[label]}${label.toUpperCase().padEnd(7)}${RESET}`;
  const stream =
    level === "error" || level === "warn" ? console.error : console.info;

  stream(`${DIM}${timestamp}${RESET}${scope} ${tag}`, ...args);
}

/**
 * Levelled logger with timestamps and shard tags.
 *
 * Kept dependency-free deliberately: logging libraries that patch the global
 * `console` make a stack trace hard to attribute to a module.
 */
const logger = {
  debug: (...args) => write("debug", "debug", args),
  error: (...args) => write("error", "error", args),
  info: (...args) => write("info", "info", args),
  success: (...args) => write("info", "success", args),
  warn: (...args) => write("warn", "warn", args),
};

export default logger;
