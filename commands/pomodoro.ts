import { createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { Message, MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { Command } from "../lib/Command";
const notifResource = createAudioResource(`${__dirname}/../assets/notif.wav`)
export default new Command()
    .setName("pomodoro")
    .setDescription("Commands for setting up a pomodoro timer")
    .setHandler(async (interaction) => {
        if(!interaction.member || !interaction.inCachedGuild()){
            await interaction.reply({embeds:[new MessageEmbed()
                .setTitle("Server only command")
                .setColor(Colors.error)
                .setDescription("Sorry, but pomodoro timers are only available in a server")
            ]});
            return false;
        }
        let vcId = interaction.member.voice.channelId;
        if(!vcId){
            await interaction.reply({embeds:[new MessageEmbed()
                .setTitle("Please join a VC")
                .setColor(Colors.error)
                .setDescription("Please join a voice channel to use pomodoro timers")
            ]});
            return false;
        }
        if(interaction.options.getSubcommand() === "start"){
            let player = createAudioPlayer();
            let connection = joinVoiceChannel({
                channelId: vcId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });
            connection.subscribe(player);
            await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
            player.play(notifResource);
        }
        return true;
    })
    .addSubcommand(subcmd => subcmd
        .setName("start")
        .setDescription("Start a new pomodoro session (4x25mins)"))
    .addSubcommand(subcmd => subcmd
        .setName("status")
        .setDescription("Shows the status of the current pomodoro session"))