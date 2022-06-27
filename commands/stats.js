"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const embeds_1 = require("../assets/embeds");
const Command_1 = require("../lib/classes/Command");
const prisma_1 = __importDefault(require("../lib/common/prisma"));
exports.default = new builders_1.SlashCommandBuilder()
    .setName("stats")
    .setDescription("Retrieve the studying stats for you and your server")
    .addSubcommand(subcmd => subcmd
    .setName("personal")
    .setDescription("View your own studying stats")
    .addStringOption(option => option
    .setName("time")
    .setDescription("The time period that the stats shoudl be on")
    .setChoices([
    ["last 24hrs", "day"],
    ["last week", "week"],
    ["last month", "month"]
])))
    .addSubcommand(subcmd => subcmd
    .setName("server")
    .setDescription("View the studying statistics of the current server")
    .addStringOption(option => option
    .setName("time")
    .setDescription("The time period that the stats shoudl be on")
    .setChoices([
    ["last 24hrs", "day"],
    ["last week", "week"],
    ["last month", "month"],
    ["all time", "all_time"]
])));
(0, Command_1.addCommandHandler)(/^stats/, async (interaction) => {
    if (interaction.guildId === null) {
        await interaction.reply({ embeds: [embeds_1.Embeds.SERVER_ONLY] });
        return "ERROR";
    }
    await interaction.deferReply();
    let scope = interaction.options.getSubcommand();
    let durationString = (interaction.options.getString("time") || "week");
    let duration = (24 * 60 * 60 * 1000) * (durationString === "day" ? 1 : durationString === "week" ? 7 : 30);
    let afterDate = (durationString === "all_time") ? new Date(1) : new Date(Date.now() - duration);
    let sessionsCompleted = 0;
    let timeCompleted = 0;
    let tasksCompleted = 0;
    if (scope === "server") {
        sessionsCompleted = await prisma_1.default.session.count({ where: {
                guildId: interaction.guildId,
                started: { gte: afterDate }
            } });
        timeCompleted = (await prisma_1.default.sessionParticipant.aggregate({
            _sum: { timeCompleted: true },
            where: { session: {
                    guildId: interaction.guildId,
                    started: { gte: afterDate }
                } }
        }))._sum.timeCompleted || 0;
        tasksCompleted = (await prisma_1.default.sessionParticipant.findMany({
            select: { tasksCompleted: true },
            where: { session: {
                    guildId: interaction.guildId,
                    started: { gte: afterDate }
                } }
        })).reduce((prev, curr) => prev + curr.tasksCompleted.length, 0);
    }
    else if (scope === "personal") {
        sessionsCompleted = await prisma_1.default.sessionParticipant.count({
            where: {
                userId: interaction.user.id,
                session: { started: { gte: afterDate } }
            }
        });
        timeCompleted = (await prisma_1.default.sessionParticipant.aggregate({
            _sum: { timeCompleted: true },
            where: {
                userId: interaction.user.id,
                session: { started: { gte: afterDate } }
            }
        }))._sum.timeCompleted || 0;
        tasksCompleted = (await prisma_1.default.sessionParticipant.findMany({
            select: { tasksCompleted: true },
            where: {
                userId: interaction.user.id,
                session: { started: { gte: afterDate } }
            }
        })).reduce((prev, curr) => prev + curr.tasksCompleted.length, 0);
    }
    await interaction.editReply({ embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.success)
                .setTitle(`Studying statistics for ${scope === "server" ? interaction.guild?.name : interaction.user.username}`)
                .setDescription(durationString === "all_time" ? "> Showing activities from all time" : `> Filtering pomdoro sessions from a ${durationString} ago`)
                .addField("`📅` Sessions", sessionsCompleted + " sessions completed in total")
                .addField("`⏰` Time studied", `${Math.floor(timeCompleted / 60000)} minutes studied in total`)
                .addField("`✅` Tasks", `${tasksCompleted} tasks completed in total`)
        ] });
    return "SUCCESS";
});
//# sourceMappingURL=stats.js.map