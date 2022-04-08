"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const Command_1 = require("../lib/Command");
const notifResource = (0, voice_1.createAudioResource)(`${__dirname}/../assets/notif.wav`);
exports.default = new Command_1.Command()
    .setName("pomodoro")
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
    if (interaction.options.getSubcommand() === "start") {
        let player = (0, voice_1.createAudioPlayer)();
        let connection = (0, voice_1.joinVoiceChannel)({
            channelId: vcId,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });
        connection.subscribe(player);
        await (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 10000);
        player.play(notifResource);
    }
    return true;
})
    .addSubcommand(subcmd => subcmd
    .setName("start")
    .setDescription("Start a new pomodoro session (4x25mins)"))
    .addSubcommand(subcmd => subcmd
    .setName("status")
    .setDescription("Shows the status of the current pomodoro session"));
//# sourceMappingURL=pomodoro.js.map