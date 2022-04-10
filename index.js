"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Command_1 = require("./lib/Command");
const colors_1 = require("./assets/colors");
const config_1 = require("./assets/config");
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES] });
Command_1.Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`));
client.once("ready", () => {
    console.log("Connected to Discord.");
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
const activities = [{ name: "pomodoro timers", type: "PLAYING" }, { name: "prototype lofi beats", type: "LISTENING" }, { name: "/help", type: "PLAYING" }, { name: "you study", type: "WATCHING" }];
setInterval(() => {
    client.user?.setPresence({ status: "online", afk: false, activities: [
            activities[Math.floor(Math.random() * activities.length)]
        ] });
}, 100000);
client.login(config_1.DISCORD_TOKEN);
//# sourceMappingURL=index.js.map