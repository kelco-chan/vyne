"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const Command_1 = require("../lib/classes/Command");
exports.default = new builders_1.SlashCommandBuilder()
    .setName("help")
    .setDescription("Displays a list of commands in vyne.");
(0, Command_1.addCommandHandler)("help", async (interaction) => {
    await interaction.reply({ embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.success)
                .setTitle("Commands in Vyne")
                .setDescription(Command_1.loadedCommands.map((command) => `**/${command.name}**\n> ${command.description}`).join("\n\n"))
        ] });
    return "SUCCESS";
});
//# sourceMappingURL=help.js.map