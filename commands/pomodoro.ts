import { Message, MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { Command } from "../lib/Command";
import { Pomodoro } from "../lib/Pomodoro";

export default new Command()
    .setName("pomo")
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
        let currentSession = Pomodoro.active.find(pomo => pomo.interaction.guildId)
        let subcmd = interaction.options.getSubcommand();
        if(subcmd === "start"){
            if(currentSession){
                await interaction.reply({embeds:[
                    new MessageEmbed()
                        .setTitle("Session already running")
                        .setColor(Colors.error)
                        .setDescription(`There is already a pomodoro session in your current guild in <#${currentSession.vcId}>. Join the voice channel and run \`/pomo status\` to view its status.`)
                ]});
                return false;
            }
            let pomo = new Pomodoro(vcId, interaction, interaction.guild);
            await pomo.initVoice();
            await interaction.reply({content:"Started pomodoro session", ephemeral: true})
            await pomo.displayUpdate();
            return true;
        }else if(subcmd === "status" || subcmd === "pause" || subcmd === "resume" || subcmd === "stop"){
            if(!currentSession){
                await interaction.reply({embeds:[
                    new MessageEmbed()
                        .setTitle("No session running")
                        .setColor(Colors.error)
                        .setDescription("There are no active pomodoro sessions in this voice channel right now to query nor modify. Please start one using `/pomo start`")
                ]});
                return false;
            }
            if(currentSession.vcId !== interaction.member.voice.channelId){
                await interaction.reply({embeds:[
                    new MessageEmbed()
                        .setTitle("Session isn't here")
                        .setColor(Colors.error)
                        .setDescription(`The pomodoro session is currently active in <#${currentSession.vcId}>. Please join that voice channel instead to use pomodoro timers`)
                ]});
                return false;
            }
            let embed:MessageEmbed;
            //force an update
            if(subcmd === "status"){    
                currentSession.update();
                embed = currentSession.getStatusEmbed();
            }else if(subcmd === "pause"){
                currentSession.pause();
                embed = currentSession.getStatusEmbed().setTitle("Session paused");
            }else if(subcmd === "resume"){
                currentSession.resume();
                embed = currentSession.getStatusEmbed().setTitle("Session resumed");
            }else if(subcmd === "stop"){
                currentSession.destroy();
                embed = new MessageEmbed()
                    .setTitle("Session stopped")
                    .setColor(Colors.error)
                    .setDescription(`The session in <#${vcId}> has been successfully stopped.`)
            }else{
                throw new Error("unreachable code");
            }
            await interaction.reply({embeds:[embed]});
            return true;
        }else{
            throw new Error(`Unknown subcommand ${interaction.options.getSubcommand()}`)
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
        .setDescription("Stop the pomodoro session prematurely and terminate it."))