import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { addCommandHandler, loadedCommands } from "../lib/classes/Command";

export default new SlashCommandBuilder()
    .setName("help")
    .setDescription("Displays a list of commands in vyne.")
    
addCommandHandler("help", async interaction => {
    await interaction.reply({embeds:[
        new MessageEmbed()
            .setColor(Colors.success)
            .setTitle("Commands in Vyne")
            .setDescription(loadedCommands.map((command) => `**/${command.name}**\n> ${command.description}`).join("\n\n"))
    ]});
    return "SUCCESS";
})