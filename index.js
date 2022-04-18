"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Command_1 = require("./lib/Command");
const config_1 = require("./assets/config");
const embeds_1 = require("./assets/embeds");
const InteractionCache_1 = require("./lib/InteractionCache");
const discord_modals_1 = __importDefault(require("discord-modals"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES] });
(0, discord_modals_1.default)(client);
Command_1.Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`));
prisma_1.default.$connect();
client.once("ready", () => {
    console.log(`Connected to Discord, serving ${client.guilds.cache.size} guilds.`);
});
//handler for commands
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand())
        return;
    for (let command of Command_1.Command.loaded) {
        if (!command.matches(interaction))
            continue;
        try {
            let succeeded = await command.handler(interaction);
        }
        catch (e) {
            console.error(e);
            await interaction.reply({ embeds: [embeds_1.Embeds.UNKNOWN_ERROR] });
        }
    }
    if (!interaction.replied) {
        await interaction.reply({ embeds: [embeds_1.Embeds.UNKNOWN_COMMAND] });
    }
});
//handler for buttons
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton())
        return;
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command_1.Command.loaded) {
            for (let buttonHandler of command.buttonHandlers) {
                let success = await buttonHandler(interaction, entry);
                if (success === true) {
                    ; //successful exection
                }
                else if (success === false) {
                    ; //absolute disaster struck
                }
                else if (success === undefined) {
                    ; ///didnt match nooooo
                }
            }
        }
    }
    catch (e) {
        console.error(e);
        await interaction.reply({ embeds: [embeds_1.Embeds.UNKNOWN_ERROR] });
    }
    if (!interaction.replied)
        await interaction.reply({ embeds: [embeds_1.Embeds.UNKNOWN_COMMAND] });
});
//handler for select menus
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isSelectMenu())
        return;
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command_1.Command.loaded) {
            for (let selectMenuHandler of command.selectMenuHandlers) {
                let success = await selectMenuHandler(interaction, entry);
                if (success === true) {
                    ; //successful exection
                }
                else if (success === false) {
                    ; //absolute disaster struck
                }
                else if (success === undefined) {
                    ; ///didnt match nooooo
                }
            }
        }
    }
    catch (e) {
        console.error(e);
        await interaction.reply({ embeds: [embeds_1.Embeds.UNKNOWN_ERROR] });
    }
    if (!interaction.replied)
        await interaction.reply({ embeds: [embeds_1.Embeds.UNKNOWN_COMMAND] });
});
client.on("modalSubmit", async (interaction) => {
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command_1.Command.loaded) {
            for (let modalHandler of command.modalHandlers) {
                let success = await modalHandler(interaction, entry);
                if (success === true) {
                    ; //successful exection
                }
                else if (success === false) {
                    ; //absolute disaster struck
                }
                else if (success === undefined) {
                    ; ///didnt match nooooo
                }
            }
        }
    }
    catch (e) {
        console.error(e);
        await interaction.reply({ embeds: [embeds_1.Embeds.UNKNOWN_ERROR] });
    }
    if (!interaction.replied)
        await interaction.reply({ embeds: [embeds_1.Embeds.UNKNOWN_COMMAND] });
});
setInterval(() => {
    const activities = [{ name: "with pomodoro timers", type: "PLAYING" }, { name: "you study", type: "WATCHING" }, { name: `over ${client.guilds.cache.size} servers`, type: "WATCHING" }];
    client.user?.setPresence({ status: "online", afk: false, activities: [
            activities[Math.floor(Math.random() * activities.length)]
        ] });
}, 100000);
client.login(config_1.DISCORD_TOKEN);
//# sourceMappingURL=index.js.map