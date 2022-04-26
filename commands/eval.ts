import { MessageAttachment, MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { Command } from "../lib/classes/Command";
import { Pomodoro } from "../lib/classes/Pomodoro";
import prisma from "../lib/prisma";
import {cache, resolveEntry} from "../lib/classes/InteractionCache";
let classes = {
    Pomodoro,
    Command,
    cache,
    resolveEntry,
    prisma
}
classes = classes
export default new Command()
    .setName("eval")
    .setDescription("Evaluates a javascript function and NOT an expression. DEVELOPER ONLY")
    .setHandler(async function (interaction){
        if(interaction.user.id !== "624510393292816395") return false;//I DONT CARE ABOUT PEASANTS
        await interaction.deferReply();
        let str = interaction.options.getString("command", true);
        try{
            let fn =  eval(`${str}`)
            let results = JSON.stringify(await fn());
            let baseEmbed =  new MessageEmbed()
                .setColor(Colors.success)
                .setTitle("Evaluation successful")
                .addField("Function", "```js\n" + str + "\n```")
            if(results.length > 1000){
                await interaction.editReply({embeds:[
                    baseEmbed.addField("Results", "attached")
                ], files:[new MessageAttachment(Buffer.from(results))]})
            }else{
                await interaction.editReply({embeds:[
                   baseEmbed.addField("Results", results)
                ]})
            }
            
            return true;
        }catch(err){
            let e = err as Error;
            await interaction.editReply({embeds:[
                new MessageEmbed()
                    .setColor(Colors.error)
                    .setTitle("Evaluation failed")
                    .addField("Function", "```js\n" + str + "\n```")
                    .addField("Name", "" + e.name)
                    .addField("Stack", "" + e.stack)
                    .addField("Error", e.message)
            ]})
            return false;
        }
        
    })
    .devOnly()
    .addStringOption(option => option
        .setName("command")
        .setDescription("The command to be evaluated")
        .setRequired(true))