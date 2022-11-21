import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { addButtonHandler, addCommandHandler } from "../lib/classes/Command";
import { cache } from "../lib/classes/InteractionCache";
import prisma from "../lib/common/prisma";

export default new SlashCommandBuilder()
    .setName("deletemydata")
    .setDescription("Delete all your data that is stored by Vyne")

addCommandHandler("deletemydata", async interaction => {
    await interaction.reply({
        embeds:[
            new MessageEmbed()
                .setColor(Colors.error)
                .setTitle("⚠ Do you confirm to continue?")
                .setDescription("Deleting your data will **permanently** wipe all stats of your account. This is IRREVERSIBLE.")
            
        ],
        components:[
            new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel("Cancel")
                        .setStyle("SUCCESS")
                        .setCustomId(cache({
                            cmd: "delete_my_data",
                            action: "cancel"
                        }, {
                            users: [interaction.user.id],
                        })),
                    new MessageButton()
                        .setLabel("Confirm")
                        .setStyle("DANGER")
                        .setCustomId(cache({
                            cmd: "delete_my_data",
                            action: "confirm"
                        }, {
                            users: [interaction.user.id],
                        }))
                )
        ]
    })
    return "SUCCESS";
})
addButtonHandler<{cmd: string, action: "confirm" | "cancel"}>(async (interaction, {data}) => {
    if(data.cmd !== "delete_my_data") return "NO_MATCH";
    if(data.action === "cancel"){
        await interaction.reply({
            embeds:[
                new MessageEmbed()
                    .setColor(Colors.error)
                    .setTitle("Cancelled")
                    .setDescription("The request to clear your data has been cancelled. Phew!")
            ]
        })
    }else if(data.action === "confirm"){
        await interaction.update({
            embeds:[new MessageEmbed()
                .setTitle("Deleting ...")
                .setDescription("Please wait patiently whilst your data is being deleted. This will not take long.")
            ],
            components:[]
        })
        await Promise.all([
            prisma.sessionParticipant.deleteMany({
                where:{
                    userId: interaction.user.id
                }
            }),
            prisma.todoItem.deleteMany({
                where:{
                    userId: interaction.user.id
                }
            })
        ])

        await interaction.followUp({
            embeds:[
                new MessageEmbed()
                    .setColor(Colors.success)
                    .setTitle("Data deleted")
                    .setDescription("All of your previous data has been deleted and your statistics have been wiped clean.")
            ],
            components:[]
        })
        
        
        
        
    }
    return "SUCCESS";
})