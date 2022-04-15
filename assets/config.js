"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_TIMER_ALLOWED_ERROR = exports.GLOBAL_TIMER_SWEEP_INTERVAL = exports.WORK_DURATION = exports.SESSION_DURATION = exports.DISCORD_CLIENT_ID = exports.DEV_GUILD_ID = exports.DISCORD_TOKEN = void 0;
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
//# sourceMappingURL=config.js.map