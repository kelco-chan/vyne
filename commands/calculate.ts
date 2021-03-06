import mexp from "math-expression-evaluator";
import { MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { stripIndents } from "common-tags";
import { SlashCommandBuilder } from "@discordjs/builders";
import { addCommandHandler } from "../lib/classes/Command";
export default new SlashCommandBuilder()
    .setName("calculate")
    .setDescription("Calculate a mathematical expression")
    .addStringOption(option => option
        .setName("expression")
        .setDescription("The expression that you want to calculate")
        .setAutocomplete(false)
        .setRequired(true))

addCommandHandler("calculate", async function(interaction){
    let exp = interaction.options.getString("expression", true);
    let succeeded = true;
    let result;
    try{
        result = mexp.eval(exp);
    }catch(e: any){
        succeeded = false;
        result = e?.message || "An unknown error occured whilst evaluating your expression";
    }
    await interaction.reply({embeds:[
        new MessageEmbed()
            .setTitle(`Calculation ${succeeded ? "succeeded" : "failed"}`)
            .setColor(succeeded ? Colors.success : Colors.error)
            .addField("Expression", "```" + exp + "```")
            .addField("Result", "```" + result + "```")
    ]});
    return succeeded ? "SUCCESS" : "ERROR";
})