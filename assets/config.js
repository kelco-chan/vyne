"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_ENV = exports.DEV_EVAL_CHANNEL_ID = exports.PROD_EVAL_CHANNEL_ID = exports.LE_CONSOLE_BOT_TOKEN = exports.DEV_USER_ID = exports.ERROR_LOGGING_CHANNEL = exports.GUILD_LOGGING_CHANNEL = exports.CUSTOMID_CACHE_DEFAULT_LIFETIME = exports.CUSTOMID_SWEEP_INTERVAL = exports.MAX_TIMER_ALLOWED_ERROR = exports.GLOBAL_TIMER_SWEEP_INTERVAL = exports.WORK_DURATION = exports.SESSION_DURATION = exports.DISCORD_CLIENT_ID = exports.DEV_GUILD_ID = exports.DISCORD_TOKEN = void 0;
exports.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";
exports.DEV_GUILD_ID = process.env.DEV_GUILD_ID || "";
exports.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
exports.SESSION_DURATION = 30 * 60000;
exports.WORK_DURATION = 25 * 60000;
exports.GLOBAL_TIMER_SWEEP_INTERVAL = exports.SESSION_DURATION / 6;
/**
 * Maximum allowed error in pomodoro alert timing in MS
 */
exports.MAX_TIMER_ALLOWED_ERROR = 100;
exports.CUSTOMID_SWEEP_INTERVAL = 40000;
exports.CUSTOMID_CACHE_DEFAULT_LIFETIME = 10 * 60000;
exports.GUILD_LOGGING_CHANNEL = "967872367802073209";
exports.ERROR_LOGGING_CHANNEL = "967863405119688754";
exports.DEV_USER_ID = "624510393292816395";
/**
 * Logging eval channels
 */
exports.LE_CONSOLE_BOT_TOKEN = process.env.LE_CONSOLE_BOT_TOKEN || "";
exports.PROD_EVAL_CHANNEL_ID = "970447986549219328";
exports.DEV_EVAL_CHANNEL_ID = "970448444927918080";
exports.NODE_ENV = process.env.NODE_ENV || "";
//# sourceMappingURL=config.js.map