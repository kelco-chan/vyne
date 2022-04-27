"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const Command_1 = require("../lib/classes/Command");
const Pomodoro_1 = require("../lib/classes/Pomodoro");
const prisma_1 = __importDefault(require("../lib/prisma"));
const InteractionCache_1 = require("../lib/classes/InteractionCache");
let classes = {
    Pomodoro: Pomodoro_1.Pomodoro,
    Command: Command_1.Command,
    cache: InteractionCache_1.cache,
    resolveEntry: InteractionCache_1.resolveEntry,
    prisma: prisma_1.default
};
classes = classes;
exports.default = new Command_1.Command()
    .setName("eval")
    .setDescription("Evaluates a javascript function and NOT an expression. DEVELOPER ONLY")
    .setHandler(async function (interaction) {
    if (interaction.user.id !== "624510393292816395")
        return false; //I DONT CARE ABOUT PEASANTS
    await interaction.deferReply();
    let str = interaction.options.getString("command", true);
    try {
        let fn = eval(`${str}`);
        let results = JSON.stringify(await fn());
        let baseEmbed = new discord_js_1.MessageEmbed()
            .setColor(colors_1.Colors.success)
            .setTitle("Evaluation successful")
            .addField("Function", "```js\n" + str + "\n```");
        if (results.length > 1000) {
            await interaction.editReply({ embeds: [
                    baseEmbed.addField("Results", "attached")
                ], files: [new discord_js_1.MessageAttachment(Buffer.from(results))] });
        }
        else {
            await interaction.editReply({ embeds: [
                    baseEmbed.addField("Results", results)
                ] });
        }
        return true;
    }
    catch (err) {
        let e = err;
        await interaction.editReply({ embeds: [
                new discord_js_1.MessageEmbed()
                    .setColor(colors_1.Colors.error)
                    .setTitle("Evaluation failed")
                    .addField("Function", "```js\n" + str + "\n```")
                    .addField("Name", "" + e.name)
                    .addField("Stack", "" + e.stack)
                    .addField("Error", e.message)
            ] });
        return false;
    }
})
    .devOnly()
    .addStringOption(option => option
    .setName("command")
    .setDescription("The command to be evaluated")
    .setRequired(true));
//# sourceMappingURL=eval.js.map