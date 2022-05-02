export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";
export const DEV_GUILD_ID = process.env.DEV_GUILD_ID || "";
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";

export const SESSION_DURATION = 30 * 60_000;
export const WORK_DURATION = 25 * 60_000;

export const GLOBAL_TIMER_SWEEP_INTERVAL = Math.max(SESSION_DURATION / 30, 1_000);
/**
 * Maximum allowed error in pomodoro alert timing in MS
 */
export const MAX_TIMER_ALLOWED_ERROR = 100;
export const CUSTOMID_SWEEP_INTERVAL = 40_000;
export const CUSTOMID_CACHE_DEFAULT_LIFETIME = 10 * 60_000;

export const GUILD_LOGGING_CHANNEL = "967872367802073209";
export const ERROR_LOGGING_CHANNEL = "967863405119688754";

export const DEV_USER_ID = "624510393292816395";

/**
 * Logging eval channels
 */
export const LE_CONSOLE_BOT_TOKEN = process.env.LE_CONSOLE_BOT_TOKEN || "";
export const PROD_EVAL_CHANNEL_ID = "970447986549219328";
export const DEV_EVAL_CHANNEL_ID = "970448444927918080";

export const NODE_ENV = process.env.NODE_ENV || "";