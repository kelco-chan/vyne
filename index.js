"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Command_1 = require("./lib/Command");
const config_json_1 = __importDefault(require("./config.json"));
const colors_1 = require("./assets/colors");
const Pomodoro_1 = require("./lib/Pomodoro");
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES] });
Command_1.Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`));
client.once("ready", () => {
    console.log("Connected to Discord.");
    Pomodoro_1.Pomodoro.bindClient(client);
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
            await interaction.reply({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setTitle("Something ran wrong ...")
                        .setColor(colors_1.Colors.error)
                        .setDescription("An unexpected error occured and the command was termined. Please try again, but if this issue persists please contact Silenced#8839.")
                ] });
        }
    }
    if (!interaction.replied) {
        await interaction.reply({ embeds: [
                new discord_js_1.MessageEmbed()
                    .setTitle("Unknown command")
                    .setColor(colors_1.Colors.error)
                    .setDescription("Somehow you managed to send in an unknown command and studybot didn't know how to respond. Interesting.")
            ] });
    }
});
client.login(config_json_1.default.DISCORD_TOKEN);
//# sourceMappingURL=index.js.map