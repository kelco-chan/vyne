import { MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { Embeds } from "../assets/embeds";
import { Command } from "../lib/Command";
import prisma from "../lib/prisma";

export default new Command()
    .setName("stats")
    .setDescription("Retrieve the studying stats for you and your server")
    .setHandler(async (interaction) => {
        if(interaction.guildId === null){
            await interaction.reply({embeds: [Embeds.SERVER_ONLY]});
            return false;
        }
        let scope = <"server" | "personal"> interaction.options.getString("scope", true);
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
        await interaction.reply({embeds: [
            new MessageEmbed()
                .setColor(Colors.success)
                .setTitle(`Stats for ${scope === "server" ? interaction.guild?.name : interaction.user.username}`)
                .setDescription(`filtering all activity in the last ${durationString}`)
                .addField("Sessions completed", sessionsCompleted + "", true)
                .addField("Time studied", `${Math.floor(timeCompleted / 60_000)} minutes`, true)
                .addField("Tasks completed", `${tasksCompleted}`, true)
        ]})
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
        ]))