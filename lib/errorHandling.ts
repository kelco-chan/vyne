import { stripIndents } from "common-tags";
import { ButtonInteraction, CommandInteraction, Interaction, MessageEmbed, ModalSubmitInteraction, SelectMenuInteraction, TextBasedChannel, TextChannel } from "discord.js";
import { ERROR_LOGGING_CHANNEL } from "../assets/config";
import { Embeds } from "../assets/embeds";

export async function reject(interaction: {channel: TextBasedChannel | null | undefined} & Interaction , error: Error, timeStarted: number){
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
    interaction.channel?.send({embeds:[Embeds.UNKNOWN_ERROR]});
    throw error;
}