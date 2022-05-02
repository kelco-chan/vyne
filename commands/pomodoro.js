"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_modals_1 = require("discord-modals");
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const embeds_1 = require("../assets/embeds");
const Command_1 = require("../lib/classes/Command");
const InteractionCache_1 = require("../lib/classes/InteractionCache");
const Pomodoro_1 = require("../lib/classes/Pomodoro");
const prisma_1 = __importDefault(require("../lib/common/prisma"));
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
    let currentSession = Pomodoro_1.Pomodoro.active.find(pomo => interaction.guildId === pomo.interaction.guildId);
    let subcmd = interaction.options.getSubcommand();
    if (subcmd === "start") {
        if (currentSession) {
            await interaction.reply({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setTitle("Session already running")
                        .setColor(colors_1.Colors.error)
                        .setDescription(`There is already a pomodoro session in your current guild in <#${currentSession.vcId}>. Join the voice channel and run \`/pomo status\` to view its status.`)
                        .setFooter({ text: `Session ID: ${currentSession.id} · Voice channel: ${currentSession.vcId}` })
                ] });
            return false;
        }
        if (!interaction.channel)
            return false;
        let perms = interaction.guild.me?.permissionsIn(interaction.channel);
        if (!perms)
            return false;
        if (perms.has("SEND_MESSAGES")) {
            ; //do nothing
        }
        else {
            await interaction.reply({ embeds: [embeds_1.Embeds.INSUFFICIENT_PERMS] });
            return false;
        }
        let pomo = new Pomodoro_1.Pomodoro(vcId, interaction, interaction.guild);
        pomo.init();
        await interaction.reply({ content: "Started pomodoro session", ephemeral: true });
        await pomo.displayUpdate();
        return true;
    }
    else if (subcmd === "status") {
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
                        .setFooter({ text: `Session ID: ${currentSession.id} · Voice channel: ${currentSession.vcId}` })
                ] });
            return false;
        }
        currentSession.update();
        await interaction.reply(currentSession.getStatusPayload());
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
    await interaction.reply({ ephemeral: true, embeds: [
            new discord_js_1.MessageEmbed()
                .setTitle("Task saved")
                .setColor(colors_1.Colors.success)
                .setDescription("Your task has been successfully saved, and you held yourself accountable for what you did in the last 25 minutes!")
                .setFooter({ text: `Session ID: ${data.sessionId}`, iconURL: interaction.client.user?.avatarURL() || "" })
        ] });
    return true;
})
    .addButtonHandler(async (interaction, { data }) => {
    if (data.cmd !== "update_pomodoro_embed_status")
        return;
    let session = Pomodoro_1.Pomodoro.active.find(session => session.id === data.sessionId);
    if (!session) {
        await interaction.update({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT] });
        return false;
    }
    session.update();
    await interaction.update(session.getStatusPayload());
    return true;
})
    .addButtonHandler(async (interaction, { data }) => {
    if ((data.cmd !== "resume_pomodoro") && (data.cmd !== "pause_pomodoro") && (data.cmd !== "stop_pomodoro"))
        return;
    if (!interaction || !interaction.inCachedGuild()) {
        await interaction.reply({ embeds: [embeds_1.Embeds.SERVER_ONLY] });
        return false;
    }
    let session = Pomodoro_1.Pomodoro.active.find(session => session.id === data.sessionId);
    if (!session) {
        await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_SESSION] });
        return false;
    }
    if (interaction.member.voice.channelId !== session.vcId) {
        await interaction.reply({ embeds: [
                new discord_js_1.MessageEmbed()
                    .setTitle("Join the voice channel")
                    .setColor(colors_1.Colors.error)
                    .setDescription(`The pomodoro session is currently active in <#${session.vcId}>. Please join that voice channel instead to use pomodoro timers`)
                    .setFooter({ text: `Session ID: ${session.id} · Voice channel: ${session.vcId}` })
            ] });
        return false;
    }
    if (data.cmd === "pause_pomodoro") {
        session.pause();
    }
    else if (data.cmd === "resume_pomodoro") {
        session.resume();
    }
    else if (data.cmd === "stop_pomodoro") {
        session.destroy();
    }
    let payload = session.getStatusPayload();
    if (data.cmd === "pause_pomodoro") {
        payload.embeds[0]?.setTitle("Session paused").setColor(colors_1.Colors.error);
    }
    else if (data.cmd === "resume_pomodoro") {
        payload.embeds[0]?.setTitle("Session resumed");
    }
    else if (data.cmd === "stop_pomodoro") {
        payload.embeds[0] = new discord_js_1.MessageEmbed()
            .setTitle("Session stopped")
            .setColor(colors_1.Colors.error)
            .setDescription(`The session in <#${session.vcId}> has been successfully stopped.`);
        payload.components = [];
    }
    session.update();
    await interaction.update(payload);
    return true;
})
    .addSubcommand(subcmd => subcmd
    .setName("start")
    .setDescription("Start a new pomodoro session (4x25mins)"))
    .addSubcommand(subcmd => subcmd
    .setName("status")
    .setDescription("Shows the status of the current pomodoro session"));
//# sourceMappingURL=pomodoro.js.map