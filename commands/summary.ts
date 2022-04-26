import { MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { Embeds } from "../assets/embeds";
import { Command } from "../lib/classes/Command";
import prisma from "../lib/prisma";

export default new Command()
    .setName("stats")
    .setDescription("Retrieve the studying stats for you and your server")
    .setHandler(async (interaction) => {
        if(interaction.guildId === null){
            await interaction.reply({embeds: [Embeds.SERVER_ONLY]});
            return false;
        }
        await interaction.deferReply();
        let scope = <"server" | "personal">interaction.options.getSubcommand();
        let durationString = <"day" | "week" | "month" | null> interaction.options.getString("time");
        let duration = (durationString === "day" ? 1 : durationString === "week" ? 7 : 30) * 24 * 60 * 60 * 1000;
        let afterDate = durationString === null ? new Date(1) : new Date(Date.now() - duration)
        let sessionsCompleted = 0;
        let timeCompleted = 0;
        let tasksCompleted = 0;
        if(scope === "server"){
            sessionsCompleted = await prisma.session.count({where:{
                guildId: interaction.guildId,
                started:{ gte: afterDate }
            }});
            timeCompleted = (await prisma.sessionParticipant.aggregate({
                _sum:{ timeCompleted: true },
                where:{session:{
                    guildId: interaction.guildId,
                    started: { gte: afterDate }
                }}
            }))._sum.timeCompleted || 0;
            tasksCompleted = (await prisma.sessionParticipant.count({
                select:{ tasksCompleted: true },
                where:{ session:{
                    guildId: interaction.guildId,
                    started: { gte: afterDate }
                }}
            })).tasksCompleted
        }else if(scope === "personal") {
            sessionsCompleted = await prisma.sessionParticipant.count({
                where: {
                    userId: interaction.user.id,
                    session: { started: { gte: afterDate } }
                }
            })
            timeCompleted = (await prisma.sessionParticipant.aggregate({
                _sum: { timeCompleted: true },
                where:{ 
                    userId: interaction.user.id,
                    session:{ started: { gte: afterDate } }
                }
            }))._sum.timeCompleted || 0;
            tasksCompleted = (await prisma.sessionParticipant.count({
                select:{ tasksCompleted: true },
                where:{
                    userId: interaction.user.id,
                    session: { started: { gte: afterDate } } 
                }
            })).tasksCompleted
        }
        await interaction.editReply({embeds: [
            new MessageEmbed()
                .setColor(Colors.success)
                .setTitle(`Studying statistics for ${scope === "server" ? interaction.guild?.name : interaction.user.username}`)
                .setDescription(durationString === null ? "> Showing activities from all time" : `> Filtering pomdoro sessions from a ${durationString} ago`)
                .addField("`📅` Sessions", sessionsCompleted + " sessions completed in total")
                .addField("`⏰` Time studied", `${Math.floor(timeCompleted / 60_000)} minutes studied in total`)
                .addField("`✅` Tasks", `${tasksCompleted} tasks completed in total`)
        ]})
        return false;
    })
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
                ["last month", "month"]
            ])))
    