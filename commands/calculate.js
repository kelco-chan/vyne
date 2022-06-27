"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const math_expression_evaluator_1 = __importDefault(require("math-expression-evaluator"));
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const builders_1 = require("@discordjs/builders");
const Command_1 = require("../lib/classes/Command");
exports.default = new builders_1.SlashCommandBuilder()
    .setName("calculate")
    .setDescription("Calculate a mathematical expression")
    .addStringOption(option => option
    .setName("expression")
    .setDescription("The expression that you want to calculate")
    .setAutocomplete(false)
    .setRequired(true));
(0, Command_1.addCommandHandler)("calculate", async function (interaction) {
    let exp = interaction.options.getString("expression", true);
    let succeeded = true;
    let result;
    try {
        result = math_expression_evaluator_1.default.eval(exp);
    }
    catch (e) {
        succeeded = false;
        result = e?.message || "An unknown error occured whilst evaluating your expression";
    }
    await interaction.reply({ embeds: [
            new discord_js_1.MessageEmbed()
                .setTitle(`Calculation ${succeeded ? "succeeded" : "failed"}`)
                .setColor(succeeded ? colors_1.Colors.success : colors_1.Colors.error)
                .addField("Expression", "```" + exp + "```")
                .addField("Result", "```" + result + "```")
        ] });
    return succeeded ? "SUCCESS" : "ERROR";
});
//# sourceMappingURL=calculate.js.map