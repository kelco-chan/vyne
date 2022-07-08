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
    .setName("todo")
    .setDescription("Manage your todo list to stay task-oriented")
    .addSubcommand(subcmd => subcmd
    .setName("view")
    .setDescription("View items on your todo list"))
    .addSubcommand(subcmd => subcmd
    .setName("add")
    .setDescription("Add a todo task that you want to complete")
    .addStringOption(option => option
    .setName("task")
    .setDescription("The task you want to add")
    .setRequired(true)))
    .addSubcommand(subcmd => subcmd
    .setName("complete")
    .setDescription("Mark a task as completed")
    .addStringOption(option => option
    .setName("name")
    .setDescription("The name of the task. PLEASE WAIT FOR AUTOCOMPLETE.")
    .setRequired(true)
    .setAutocomplete(true)));
//viewing todo list
(0, Command_1.addCommandHandler)("todo view", async (interaction) => {
    let embed = new discord_js_1.MessageEmbed()
        .setColor(colors_1.Colors.success)
        .setTitle(interaction.user.username + "'s todo list");
    await interaction.deferReply({});
    let tasks = await prisma_1.default.todoItem.findMany({
        where: {
            userId: interaction.user.id,
            completed: null
        }
    });
    if (tasks.length === 0) {
        embed
            .setDescription("You stayed on top of your workload and you have no items on your todo list.");
    }
    else {
        embed
            .setDescription(tasks.map(task => "> " + task.description).join("\n\n"));
    }
    await interaction.editReply({ embeds: [embed] });
    return "SUCCESS";
});
(0, Command_1.addCommandHandler)("todo add", async (interaction) => {
    //await interaction.deferReply({});
    await prisma_1.default.todoItem.create({
        data: {
            user: { connectOrCreate: {
                    where: { id: interaction.user.id },
                    create: { id: interaction.user.id }
                } },
            description: interaction.options.getString("task", true),
            completed: null
        }
    });
    await interaction.reply({ embeds: [
            new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.success)
                .setTitle("Todo item added")
                .setDescription("Your todo item has been added to your list.")
        ] });
    return "SUCCESS";
});
(0, Command_1.addAutocompleteHandler)("todo complete", async (interaction) => {
    let { name, value } = interaction.options.getFocused(true);
    let completes = [];
    if (value.startsWith("#")) {
        completes = [{ name: `Todo task with id ${value.slice(1)}`, value }];
    }
    else {
        let todos = await prisma_1.default.todoItem.findMany({
            where: {
                userId: interaction.user.id,
                completed: null,
                description: { contains: value }
            }
        });
        if (todos.length === 0) {
            completes = [];
        }
        else {
            completes = todos.map(({ id, description }) => ({ name: description, value: "#" + id }));
        }
    }
    await interaction.respond(completes);
    return "SUCCESS";
});
(0, Command_1.addCommandHandler)("todo complete", async (interaction) => {
    try {
        let data = await prisma_1.default.todoItem.delete({ where: {
                id: interaction.options.getString("name", true).replace("#", "")
            } });
        await interaction.reply({ embeds: [
                new discord_js_1.MessageEmbed()
                    .setColor(colors_1.Colors.success)
                    .setTitle("Marked as complete")
                    .setDescription(`\`${data.description}\` has been marked as complete. Keep up your good work!`)
            ] });
        return "SUCCESS";
    }
    catch (e) {
        if (e.code === "P2025") {
            await interaction.reply({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setColor(colors_1.Colors.error)
                        .setTitle("Task does not exist")
                        .setDescription("The todo task specified does not exist. Run \`/todo view\` to see the list of your uncomplete todo items.")
                ] });
            return "ERROR";
        }
        throw e;
    }
});
//open the complete_todo_task prompt
(0, Command_1.addButtonHandler)(async (interaction, { data }) => {
    if (data.cmd !== "prompt_complete_todo_task")
        return "NO_MATCH";
    let tasks = await prisma_1.default.todoItem.findMany({ where: {
            userId: interaction.user.id,
            completed: null
        } });
    if (tasks.length === 0) {
        await interaction.reply({ embeds: [
                new discord_js_1.MessageEmbed()
                    .setTitle("No todo items to complete")
                    .setColor(colors_1.Colors.error)
                    .setDescription("Please come back after you have unfinished todo items")
            ] });
        return "SUCCESS";
    }
    await interaction.reply({
        ephemeral: true,
        embeds: [new discord_js_1.MessageEmbed().setTitle("Please select one or more items below").setColor(colors_1.Colors.success)],
        components: [
            new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageSelectMenu()
                .setPlaceholder("Pick items to mark as complete")
                .setMinValues(1)
                .setMaxValues(20)
                .setCustomId((0, InteractionCache_1.cache)({ cmd: "complete_todo_task" }, { users: [interaction.user.id] }))
                .setOptions(tasks.map(task => ({ label: task.description, value: task.id }))))
        ]
    });
    return "SUCCESS";
});
//manage the select menu tasks
(0, Command_1.addSelectMenuHandler)(async (interaction, { data }) => {
    if (data.cmd !== "complete_todo_task")
        return "NO_MATCH";
    let tasks = interaction.values;
    let d = await prisma_1.default.todoItem.updateMany({
        where: {
            id: { in: tasks }
        },
        data: {
            completed: new Date()
        }
    });
    await interaction.reply({
        embeds: [new discord_js_1.MessageEmbed()
                .setColor(colors_1.Colors.success)
                .setTitle("Todo item completed")
                .setDescription(d.count > 1 ? `${d.count} todo items have been marked as completed.` : "1 todo item has been marked as completed.")],
        components: [
            new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton()
                .setLabel("View todo list")
                .setCustomId((0, InteractionCache_1.cache)({ cmd: "prompt_view_todo_list" }, { users: [interaction.user.id] }))
                .setStyle("PRIMARY"))
        ]
    });
    return "SUCCESS";
});
//# sourceMappingURL=todo.js.map