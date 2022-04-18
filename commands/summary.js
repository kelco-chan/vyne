"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const embeds_1 = require("../assets/embeds");
const Command_1 = require("../lib/Command");
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.default = new Command_1.Command()
    .setName("stats")
    .setDescription("Retrieve the studying stats for you and your server")
    .setHandler(async (interaction) => {
    if (interaction.guildId === null) {
        await interaction.reply({ embeds: [embeds_1.Embeds.SERVER_ONLY] });
        return false;
    }
    let scope = interaction.options.getString("scope", true);
    let durationString = interaction.options.getString("time");
    let duration = (durationString === "day" ? 1 : durationString === "week" ? 7 : 30) * 24 * 60 * 60 * 1000;
    let afterDate = durationString === null ? new Date(1) : new Date(Date.now() - duration);
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
        tasksCompleted = (await prisma_1.default.sessionParticipant.count({
            select: { tasksCompleted: true },
            where: { session: {
                    guildId: interaction.guildId,
                    started: { gte: afterDate }
                } }
        })).tasksCompleted;
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
        tasksCompleted = (await prisma_1.default.sessionParticipant.count({
            select: { tasksCompleted: true },
            where: {
                userId: interaction.user.id,
                session: { started: { gte: afterDate } }
            }
        })).tasksCompleted;
    }
    await interaction.reply({ embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.success)
                .setTitle(`Stats for ${scope === "server" ? interaction.guild?.name : interaction.user.username}`)
                .setDescription(`filtering all activity in the last ${durationString}`)
                .addField("Sessions completed", sessionsCompleted + "", true)
                .addField("Time studied", `${Math.floor(timeCompleted / 60000)} minutes`, true)
                .addField("Tasks completed", `${tasksCompleted}`, true)
        ] });
    return false;
})
    .addStringOption(option => option
    .setName("scope")
    .setDescription("whom you want the get the stats of")
    .setChoices([
    ["server", "server"],
    ["personal", "personal"]
])
    .setRequired(true))
    .addStringOption(option => option
    .setName("time")
    .setDescription("The time period that the stats shoudl be on")
    .setChoices([
    ["last 24hrs", "day"],
    ["last week", "week"],
    ["last month", "month"]
]));
//# sourceMappingURL=summary.js.map