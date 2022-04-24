"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_tags_1 = require("common-tags");
const discord_js_1 = require("discord.js");
const config_1 = require("../assets/config");
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES] });
client.once("ready", async () => {
    console.log(`Connected to Discord and querying ${client.guilds.cache.size} guilds.`);
    let guildInfos = [];
    for (const [guildId, g] of client.guilds.cache) {
        let guild = await g.fetch();
        guildInfos.push((0, common_tags_1.stripIndents) `
        Name: ${guild.name}
        Member Count: ${guild.memberCount}
        Guild Created: ${guild.createdAt}
        Bot Joined: ${guild.joinedAt}
        `);
    }
    console.log(guildInfos.join("\n\n"));
});
client.login(config_1.DISCORD_TOKEN);
//# sourceMappingURL=getServerStats.js.map