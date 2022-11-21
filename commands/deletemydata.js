"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const Command_1 = require("../lib/classes/Command");
const InteractionCache_1 = require("../lib/classes/InteractionCache");
const prisma_1 = __importDefault(require("../lib/common/prisma"));
exports.default = new builders_1.SlashCommandBuilder()
    .setName("deletemydata")
    .setDescription("Delete all your data that is stored by Vyne");
(0, Command_1.addCommandHandler)("deletemydata", async (interaction) => {
    await interaction.reply({
        embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.error)
                .setTitle("⚠ Do you confirm to continue?")
                .setDescription("Deleting your data will **permanently** wipe all stats of your account. This is IRREVERSIBLE.")
        ],
        components: [
            new discord_js_1.MessageActionRow()
                .addComponents(new discord_js_1.MessageButton()
                .setLabel("Cancel")
                .setStyle("SUCCESS")
                .setCustomId((0, InteractionCache_1.cache)({
                cmd: "delete_my_data",
                action: "cancel"
            }, {
                users: [interaction.user.id],
            })), new discord_js_1.MessageButton()
                .setLabel("Confirm")
                .setStyle("DANGER")
                .setCustomId((0, InteractionCache_1.cache)({
                cmd: "delete_my_data",
                action: "confirm"
            }, {
                users: [interaction.user.id],
            })))
        ]
    });
    return "SUCCESS";
});
(0, Command_1.addButtonHandler)(async (interaction, { data }) => {
    if (data.cmd !== "delete_my_data")
        return "NO_MATCH";
    if (data.action === "cancel") {
        await interaction.reply({
            embeds: [
                new discord_js_1.MessageEmbed()
                    .setColor(colors_1.Colors.error)
                    .setTitle("Cancelled")
                    .setDescription("The request to clear your data has been cancelled. Phew!")
            ]
        });
    }
    else if (data.action === "confirm") {
        await interaction.update({
            embeds: [new discord_js_1.MessageEmbed()
                    .setTitle("Deleting ...")
                    .setDescription("Please wait patiently whilst your data is being deleted. This will not take long.")
            ],
            components: []
        });
        await Promise.all([
            prisma_1.default.sessionParticipant.deleteMany({
                where: {
                    userId: interaction.user.id
                }
            }),
            prisma_1.default.todoItem.deleteMany({
                where: {
                    userId: interaction.user.id
                }
            })
        ]);
        await interaction.followUp({
            embeds: [
                new discord_js_1.MessageEmbed()
                    .setColor(colors_1.Colors.success)
                    .setTitle("Data deleted")
                    .setDescription("All of your previous data has been deleted and your statistics have been wiped clean.")
            ],
            components: []
        });
    }
    return "SUCCESS";
});
//# sourceMappingURL=deletemydata.js.map