"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const Command_1 = require("../lib/Command");
const Pomodoro_1 = require("../lib/Pomodoro");
exports.default = new Command_1.Command()
    .setName("pomo")
    .setDescription("Commands for setting up a pomodoro timer")
    .setHandler(async (interaction) => {
    if (!interaction.member || !interaction.inCachedGuild()) {
        await interaction.reply({ embeds: [new discord_js_1.MessageEmbed()
                    .setTitle("Server only command")
                    .setColor(colors_1.Colors.error)
                    .setDescription("Sorry, but pomodoro timers are only available in a server")
            ] });
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
    let currentSession = Pomodoro_1.Pomodoro.find(vcId);
    let subcmd = interaction.options.getSubcommand();
    if (subcmd === "start") {
        if (currentSession) {
            await interaction.reply({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setTitle("Session already running")
                        .setColor(colors_1.Colors.error)
                        .setDescription("There is already a pomodoro session in your current voice channel. Run `/pomodoro status` to view the status or go to a different voice channel.")
                ] });
            return false;
        }
        let pomo = new Pomodoro_1.Pomodoro(vcId, interaction, interaction.guild);
        await pomo.initVoice();
        await interaction.reply({ embeds: [pomo.getStatusEmbed().setTitle("Session started")] });
        return true;
    }
    else if (subcmd === "status" || subcmd === "pause" || subcmd === "resume" || subcmd === "stop") {
        if (!currentSession) {
            await interaction.reply({ embeds: [
                    new discord_js_1.MessageEmbed()
                        .setTitle("No session running")
                        .setColor(colors_1.Colors.error)
                        .setDescription("There are no active pomodoro sessions in this voice channel right now to query nor modify. Please start one using `/pomodoro start`")
                ] });
            return false;
        }
        let embed;
        //force an update
        currentSession.update();
        if (subcmd === "status") {
            embed = currentSession.getStatusEmbed();
        }
        else if (subcmd === "pause") {
            currentSession.pause();
            embed = currentSession.getStatusEmbed().setTitle("Session paused");
        }
        else if (subcmd === "resume") {
            currentSession.resume();
            embed = currentSession.getStatusEmbed().setTitle("Session resumed");
        }
        else if (subcmd === "stop") {
            currentSession.destroy();
            embed = new discord_js_1.MessageEmbed()
                .setTitle("Session stopped")
                .setColor(colors_1.Colors.error)
                .setDescription(`The session in <#${vcId}> has been successfully stopped.`);
        }
        else {
            throw new Error("unreachable code");
        }
        await interaction.reply({ embeds: [embed] });
        return true;
    }
    else {
        throw new Error(`Unknown subcommand ${interaction.options.getSubcommand()}`);
    }
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