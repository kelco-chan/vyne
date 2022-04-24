import { MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { Command } from "../lib/classes/Command";

export default new Command()
    .setName("help")
    .setDescription("Displays a list of commands in vyne.")
    .setHandler(async interaction => {
        await interaction.reply({embeds:[
            new MessageEmbed()
                .setColor(Colors.success)
                .setTitle("Commands in Vyne")
                .setDescription(Command.loaded.map((command) => `**/${command.name}**\n> ${command.description}`).join("\n\n"))
        ]});
        return true;
    })