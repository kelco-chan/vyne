"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMID_CACHE_DEFAULT_LIFETIME = exports.CUSTOMID_SWEEP_INTERVAL = exports.MAX_TIMER_ALLOWED_ERROR = exports.GLOBAL_TIMER_SWEEP_INTERVAL = exports.WORK_DURATION = exports.SESSION_DURATION = exports.DISCORD_CLIENT_ID = exports.DEV_GUILD_ID = exports.DISCORD_TOKEN = void 0;
exports.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";
exports.DEV_GUILD_ID = process.env.DEV_GUILD_ID || "";
exports.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
exports.SESSION_DURATION = 50000;
exports.WORK_DURATION = 50000;
exports.GLOBAL_TIMER_SWEEP_INTERVAL = exports.SESSION_DURATION / 6;
/**
 * Maximum allowed error in pomodoro alert timing in MS
 */
exports.MAX_TIMER_ALLOWED_ERROR = 100;
exports.CUSTOMID_SWEEP_INTERVAL = 40000;
exports.CUSTOMID_CACHE_DEFAULT_LIFETIME = 10 * 60000;
//# sourceMappingURL=config.js.map