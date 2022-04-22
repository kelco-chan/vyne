"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const Command_1 = require("../lib/Command");
exports.default = new Command_1.Command()
    .setName("help")
    .setDescription("Displays a list of commands in vyne.")
    .setHandler(async (interaction) => {
    await interaction.reply({ embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.success)
                .setTitle("Commands in Vyne")
                .setDescription(Command_1.Command.loaded.map((command) => `**/${command.name}**\n> ${command.description}`).join("\n\n"))
        ] });
    return true;
});
//# sourceMappingURL=help.js.map