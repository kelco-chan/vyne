"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const basic_ms_1 = require("basic-ms");
const discord_modals_1 = __importDefault(require("discord-modals"));
const discord_js_1 = require("discord.js");
const colors_1 = require("../../assets/colors");
const config_1 = require("../../assets/config");
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES] });
(0, discord_modals_1.default)(client);
client.once("ready", () => {
    console.log(`Connected to Discord, serving ${client.guilds.cache.size} guilds.`);
});
setInterval(() => {
    const activities = [{ name: "with pomodoro timers", type: "PLAYING" }, { name: "you study", type: "WATCHING" }, { name: `over ${client.guilds.cache.size} servers`, type: "WATCHING" }];
    client.user?.setPresence({ status: "online", afk: false, activities: [
            activities[Math.floor(Math.random() * activities.length)]
        ] });
}, 100000);
client.on("guildCreate", async function (guild) {
    let channel = (await client.channels.fetch(config_1.GUILD_LOGGING_CHANNEL));
    channel && channel.send({ embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.success)
                .setTitle(`Joined guild ${guild.name}`)
                .addField("Members", `${guild.memberCount || guild.approximateMemberCount}`, true)
                .addField("Created", `${guild.createdAt.toLocaleDateString()}`, true)
                .addField("Locale", guild.preferredLocale, true)
                .setFooter({ text: `Total guild count: ${client.guilds.cache.size}` })
        ] });
});
client.on("guildDelete", async function (guild) {
    let channel = (await client.channels.fetch(config_1.GUILD_LOGGING_CHANNEL));
    channel && channel.send({ embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.error)
                .setTitle(`Left guild ${guild.name}`)
                .addField("Guild ID", guild.id)
                .addField("Members", `${guild.memberCount || guild.approximateMemberCount}`, true)
                .addField("Server Created", `${guild.createdAt.toLocaleDateString()}`, true)
                .addField("Joined", `${(0, basic_ms_1.msToTime)(Date.now() - guild.createdTimestamp)} ago`, true)
                .addField("Locale", guild.preferredLocale, true)
                .setFooter({ text: `Total guild count: ${client.guilds.cache.size}` })
        ] });
});
client.login(config_1.DISCORD_TOKEN);
exports.default = client;
//# sourceMappingURL=client.js.map