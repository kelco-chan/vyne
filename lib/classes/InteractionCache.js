"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEntry = exports.cache = void 0;
const nanoid_1 = require("nanoid");
const config_1 = require("../../assets/config");
let entryCache = new Map();
function cache(data, options) {
    let key = (0, nanoid_1.nanoid)();
    entryCache.set(key, {
        expires: Date.now() + (options?.duration || config_1.CUSTOMID_CACHE_DEFAULT_LIFETIME),
        intendedUsers: options.users,
        allowRepeatedUsage: options?.allowRepeatedUsage || false,
        data
    });
    return key;
}
exports.cache = cache;
function resolveEntry(interaction) {
    let entry = entryCache.get(interaction.customId);
    if (!entry)
        return undefined;
    if (!(entry.intendedUsers.includes(interaction.user.id) || entry.intendedUsers.includes("all"))) {
        return "INVALID_USER";
    }
    if (!entry.allowRepeatedUsage) {
        entryCache.delete(interaction.customId);
    }
    return entry;
}
exports.resolveEntry = resolveEntry;
setInterval(() => {
    let time = Date.now();
    let numberCleared = 0;
    for (let [key, value] of entryCache) {
        if (value.expires <= time) {
            entryCache.delete(key);
            numberCleared += 1;
        }
    }
}, config_1.CUSTOMID_SWEEP_INTERVAL);
//# sourceMappingURL=InteractionCache.js.map