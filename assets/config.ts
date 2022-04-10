export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";
export const DEV_GUILD_ID = process.env.DEV_GUILD_ID || "";
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";

export const SESSION_DURATION = 30 * 60_000;
export const WORK_DURATION = 25 * 60_000;

export const GLOBAL_TIMER_SWEEP_INTERVAL = SESSION_DURATION / 6;