"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_modals_1 = require("discord-modals");
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const embeds_1 = require("../assets/embeds");
const Command_1 = require("../lib/Command");
const InteractionCache_1 = require("../lib/InteractionCache");
const Pomodoro_1 = require("../lib/Pomodoro");
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.default = new Command_1.Command()
    .setName("pomo")
    .setDescription("Commands for setting up a pomodoro timer")
    .setHandler(async (interaction) => {
    if (!interaction.member || !interaction.inCachedGuild()) {
        await interaction.reply({ embeds: [embeds_1.Embeds.SERVER_ONLY] });
        return false;
    }
    let vcId = interaction.member.voice.channelId;
    if (!vcId) {
        await interaction.reply({ embeds: [new discord_js_1.MessageEmbed()
                    .setTitle("Please join a VC")
                    .setColor(colors_1.Colors.error)
                    .setDescription("Please join a voice channel to use pomodoro timers")
            ] });
        return false;
    }
    let currentSession = Pomodoro_1.Pomodoro.active.find(pomo => pomo.interaction.guildId);
    let subcmd = interaction.options.getSubcommand();
    if (subcmd === "start") {
        if (currentSession) {
            await interaction.reply({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setTitle("Session already running")
                        .setColor(colors_1.Colors.error)
                        .setDescription(`There is already a pomodoro session in your current guild in <#${currentSession.vcId}>. Join the voice channel and run \`/pomo status\` to view its status.`)
                ] });
            return false;
        }
        let pomo = new Pomodoro_1.Pomodoro(vcId, interaction, interaction.guild);
        pomo.init();
        await interaction.reply({ content: "Started pomodoro session", ephemeral: true });
        await pomo.displayUpdate();
        return true;
    }
    else if (subcmd === "status" || subcmd === "pause" || subcmd === "resume" || subcmd === "stop") {
        if (!currentSession) {
            await interaction.reply({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setTitle("No session running")
                        .setColor(colors_1.Colors.error)
                        .setDescription("There are no active pomodoro sessions in this voice channel right now to query nor modify. Please start one using `/pomo start`")
                ] });
            return false;
        }
        if (currentSession.vcId !== interaction.member.voice.channelId) {
            await interaction.reply({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setTitle("Session isn't here")
                        .setColor(colors_1.Colors.error)
                        .setDescription(`The pomodoro session is currently active in <#${currentSession.vcId}>. Please join that voice channel instead to use pomodoro timers`)
                ] });
            return false;
        }
        let payload = currentSession.getStatusPayload();
        //force an update
        if (subcmd === "status") {
            currentSession.update();
        }
        else if (subcmd === "pause") {
            currentSession.pause();
            payload.embeds[0]?.setTitle("Session paused");
        }
        else if (subcmd === "resume") {
            currentSession.resume();
            payload.embeds[0]?.setTitle("Session resumed");
        }
        else if (subcmd === "stop") {
            currentSession.destroy();
            payload.embeds[0] = new discord_js_1.MessageEmbed()
                .setTitle("Session stopped")
                .setColor(colors_1.Colors.error)
                .setDescription(`The session in <#${vcId}> has been successfully stopped.`);
        }
        else {
            throw new Error("unreachable code");
        }
        await interaction.reply(payload);
        return true;
    }
    else {
        throw new Error(`Unknown subcommand ${interaction.options.getSubcommand()}`);
    }
})
    .addButtonHandler(async (interaction, { data }) => {
    if (data.cmd !== "prompt_completed_task")
        return;
    let modal = new discord_modals_1.Modal()
        .setTitle("Task Completion Check")
        .setCustomId((0, InteractionCache_1.cache)({ cmd: "submit_completed_task", sessionId: data.sessionId }, { users: [interaction.user.id], duration: 3 * 60000 }))
        .addComponents(new discord_modals_1.TextInputComponent()
        .setLabel("What task did you just complete?")
        .setPlaceholder("All of the devious english homework")
        .setStyle("SHORT")
        .setRequired(true)
        .setCustomId("task"));
    await (0, discord_modals_1.showModal)(modal, { client: interaction.client, interaction });
    interaction.replied = true;
    return true;
})
    .addModalHandler(async (interaction, { data }) => {
    if (data.cmd !== "submit_completed_task")
        return;
    let task = interaction.getTextInputValue("task");
    await prisma_1.default.sessionParticipant.upsert({
        where: { userId_sessionId: {
                userId: interaction.user.id,
                sessionId: data.sessionId
            } },
        update: {
            tasksCompleted: {
                push: task
            }
        },
        create: {
            timeCompleted: 0,
            userId: interaction.user.id,
            sessionId: data.sessionId
        }
    });
    await interaction.reply({ embeds: [
            new discord_js_1.MessageEmbed()
                .setTitle("Task saved")
                .setColor(colors_1.Colors.success)
                .setDescription("Your task has been successfully saved, and you held yourself accountable for what you did in the last 25 minutes!")
                .setFooter(`Session ID: ${data.sessionId}`)
        ] });
    return true;
})
    .addSubcommand(subcmd => subcmd
    .setName("start")
    .setDescription("Start a new pomodoro session (4x25mins)"))
    .addSubcommand(subcmd => subcmd
    .setName("status")
    .setDescription("Shows the status of the current pomodoro session"))
    .addSubcommand(subcmd => subcmd
    .setName("pause")
    .setDescription("Pauses the current pomodoro session"))
    .addSubcommand(subcmd => subcmd
    .setName("resume")
    .setDescription("Resumes the current pomodoro"))
    .addSubcommand(subcmd => subcmd
    .setName("stop")
    .setDescription("Stop the pomodoro session prematurely and terminate it."));
//# sourceMappingURL=pomodoro.js.map