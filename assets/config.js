"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEV_GUILD_ID = exports.DISCORD_CLIENT_ID = exports.WORK_DURATION = exports.SESSION_DURATION = exports.GLOBAL_TIMER_SWEEP_INTERVAL = exports.DISCORD_TOKEN = void 0;
exports.DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";
exports.GLOBAL_TIMER_SWEEP_INTERVAL = parseInt(process.env.GLOBAL_TIMER_SWEEP_INTERVAL || "");
exports.SESSION_DURATION = parseInt(process.env.SESSION_DURATION || "");
exports.WORK_DURATION = parseInt(process.env.WORK_DURATION || "");
exports.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
exports.DEV_GUILD_ID = process.env.DEV_GUILD_ID || "";
//# sourceMappingURL=config.js.map