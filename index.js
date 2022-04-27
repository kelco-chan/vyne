"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Command_1 = require("./lib/classes/Command");
const config_1 = require("./assets/config");
const embeds_1 = require("./assets/embeds");
const InteractionCache_1 = require("./lib/classes/InteractionCache");
const discord_modals_1 = __importDefault(require("discord-modals"));
const Pomodoro_1 = require("./lib/classes/Pomodoro");
const PausableTimer_1 = __importDefault(require("./lib/classes/PausableTimer"));
const errorHandling_1 = require("./lib/errorHandling");
const http_1 = __importDefault(require("http"));
const colors_1 = require("./assets/colors");
//sh -c \"while true; do timeout 10800 <start command here>; done\"
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES] });
(0, discord_modals_1.default)(client);
Command_1.Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`));
client.once("ready", () => {
    console.log(`Connected to Discord, serving ${client.guilds.cache.size} guilds.`);
});
//handler for commands
client.on("interactionCreate", async (interaction) => {
    let timeStarted = Date.now();
    if (!interaction.isCommand())
        return;
    for (let command of Command_1.Command.loaded) {
        if (!command.matches(interaction))
            continue;
        try {
            await command.handler(interaction);
        }
        catch (e) {
            (0, errorHandling_1.reject)(interaction, e, timeStarted);
        }
    }
});
//handler for buttons
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton())
        return;
    let timeStarted = Date.now();
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command_1.Command.loaded) {
            for (let buttonHandler of command.buttonHandlers) {
                await buttonHandler(interaction, entry);
            }
        }
    }
    catch (e) {
        (0, errorHandling_1.reject)(interaction, e, timeStarted);
    }
});
//handler for select menus
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isSelectMenu())
        return;
    let timeStarted = Date.now();
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command_1.Command.loaded) {
            for (let selectMenuHandler of command.selectMenuHandlers) {
                selectMenuHandler(interaction, entry);
            }
        }
    }
    catch (e) {
        (0, errorHandling_1.reject)(interaction, e, timeStarted);
    }
});
client.on("modalSubmit", async (interaction) => {
    let timeStarted = Date.now();
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command_1.Command.loaded) {
            for (let modalHandler of command.modalHandlers) {
                modalHandler(interaction, entry);
            }
        }
    }
    catch (e) {
        (0, errorHandling_1.reject)(interaction, e, timeStarted);
    }
});
client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState?.member?.user?.bot || oldState?.member?.user?.bot)
        return;
    let oldSession = Pomodoro_1.Pomodoro.active.find(session => session.vcId === oldState.channelId);
    let newSession = Pomodoro_1.Pomodoro.active.find(session => session.vcId === newState.channelId);
    if (oldSession && oldState.member) {
        //this is the session that was left
        let timer = oldSession.userTimers.get(oldState.member.user.id);
        timer && timer.pause();
        let channel = await client.channels.fetch(oldSession.vcId);
        if (channel && (channel.members.size === 1)) {
            //everyone left STOP THE SESSION
            oldSession.interaction.channel?.send({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setTitle("Session Stopped")
                        .setColor(colors_1.Colors.error)
                        .setDescription("The pomodoro session was stopped since everyone left the voice channel.")
                ] });
            oldSession.destroy();
        }
    }
    if (newSession && newState.member) {
        let timer = newSession.userTimers.get(newState.member.user.id);
        if (!timer) {
            timer = new PausableTimer_1.default();
            newSession.userTimers.set(newState.member.user.id, timer);
        }
        if (newSession.paused) {
            timer.pause();
        }
        else {
            timer.resume();
        }
    }
});
http_1.default.createServer(async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET" && req.url === "/servercount") {
        res.end(JSON.stringify({
            error: false,
            data: {
                serverCount: client.guilds.cache.size
            }
        }));
    }
}).listen(process.env.PORT || 3000);
client.on("guildCreate", async function (guild) {
    let channel = (await client.channels.fetch(config_1.GUILD_LOGGING_CHANNEL));
    channel && channel.send({ embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.success)
                .setTitle(`Joined guild ${guild.name}`)
                .addField("Members", "" + guild.approximateMemberCount, true)
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
                .addField("Members", "" + guild.approximateMemberCount, true)
                .addField("Locale", guild.preferredLocale, true)
                .addField("Joined", guild.joinedAt.toLocaleDateString())
                .setFooter({ text: `Total guild count: ${client.guilds.cache.size}` })
        ] });
});
setInterval(() => {
    const activities = [{ name: "with pomodoro timers", type: "PLAYING" }, { name: "you study", type: "WATCHING" }, { name: `over ${client.guilds.cache.size} servers`, type: "WATCHING" }];
    client.user?.setPresence({ status: "online", afk: false, activities: [
            activities[Math.floor(Math.random() * activities.length)]
        ] });
}, 100000);
client.login(config_1.DISCORD_TOKEN);
//# sourceMappingURL=index.js.map