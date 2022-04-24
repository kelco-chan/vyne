import { stripIndents } from "common-tags";
import { ModalSubmitInteraction } from "discord-modals";
import { ButtonInteraction, CommandInteraction, MessageEmbed, SelectMenuInteraction, TextChannel } from "discord.js";
import { ERROR_LOGGING_CHANNEL } from "../assets/config";
import { Embeds } from "../assets/embeds";

export async function reject(interaction: CommandInteraction | SelectMenuInteraction | ButtonInteraction | ModalSubmitInteraction, error: Error, timeStarted: number){
    if(interaction.replied){
        await interaction.followUp({embeds:[Embeds.UNKNOWN_ERROR]})
    }else{
        await interaction.reply({embeds:[Embeds.UNKNOWN_ERROR]});
    }
    console.log("---- RUNTIME ERROR ----");
    console.log("Error:")
    console.error(error);
    console.log("Interaction:")
    console.dir(interaction);
    console.log("Time taken", Date.now() - timeStarted);
    console.log("-----------------------");
    let channel = await interaction.client.channels.fetch(ERROR_LOGGING_CHANNEL) as TextChannel | null;
    channel && await channel.send({embeds:[
        new MessageEmbed()
            .setTitle("Error detected during execution")
            .addField("Time Taken", `${Date.now() - timeStarted}`)
            .addField(`Error: ${error.message}`, error.stack || "")
            .addField("Context", stripIndents`
            Interaction Guild Id: ${interaction.guildId}
            Command: ${interaction.isCommand() ? interaction.commandName : "not a command"}
            `)
    ]})
    throw error;
}