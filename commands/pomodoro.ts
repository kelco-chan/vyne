import { Modal, showModal, TextInputComponent } from "discord-modals";
import { InteractionReplyOptions, Message, MessageActionRow, MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { Embeds } from "../assets/embeds";
import { Command } from "../lib/classes/Command";
import { cache, resolveEntry } from "../lib/classes/InteractionCache";
import { Pomodoro } from "../lib/classes/Pomodoro";
import prisma from "../lib/common/prisma";

export default new Command()
    .setName("pomo")
    .setDescription("Commands for setting up a pomodoro timer")
    .setHandler(async (interaction) => {
        if(!interaction.member || !interaction.inCachedGuild()){
            await interaction.reply({embeds:[Embeds.SERVER_ONLY]});
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
        let currentSession = Pomodoro.active.find(pomo => interaction.guildId === pomo.interaction.guildId)
        let subcmd = interaction.options.getSubcommand();
        if(subcmd === "start"){
            if(currentSession){
                await interaction.reply({embeds:[
                    new MessageEmbed()
                        .setTitle("Session already running")
                        .setColor(Colors.error)
                        .setDescription(`There is already a pomodoro session in your current guild in <#${currentSession.vcId}>. Join the voice channel and run \`/pomo status\` to view its status.`)
                        .setFooter({text:`Session ID: ${currentSession.id} · Voice channel: ${currentSession.vcId}`})
                ]});
                return false;
            }
            let pomo = new Pomodoro(vcId, interaction, interaction.guild);
            pomo.init()
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
                        .setFooter({text:`Session ID: ${currentSession.id} · Voice channel: ${currentSession.vcId}`})
                ]});
                return false;
            }
            let payload = currentSession.getStatusPayload() as {embeds: MessageEmbed[], components: MessageActionRow[]};
            if(subcmd === "status"){    
                currentSession.update();
            }else if(subcmd === "pause"){
                currentSession.pause();
                payload.embeds[0]?.setTitle("Session paused");
            }else if(subcmd === "resume"){
                currentSession.resume();
                payload.embeds[0]?.setTitle("Session resumed");
            }else if(subcmd === "stop"){
                currentSession.destroy();
                payload.embeds[0] = new MessageEmbed()
                    .setTitle("Session stopped")
                    .setColor(Colors.error)
                    .setDescription(`The session in <#${vcId}> has been successfully stopped.`)
                payload.components = [];
            }else{
                throw new Error("Unreachable Code");
            }
            await interaction.reply(payload);
            return true;
        }else{
            throw new Error(`Unknown subcommand ${interaction.options.getSubcommand()}`)
        }
    })
    .addButtonHandler<{cmd: string, sessionId: string}>(async (interaction, {data}) => {
        if(data.cmd !== "prompt_completed_task") return;
        let modal = new Modal()
            .setTitle("Task Completion Check")
            .setCustomId(cache({cmd:"submit_completed_task", sessionId:data.sessionId}, {users:[interaction.user.id], duration:3 * 60_000}))
            .addComponents(
                new TextInputComponent()
                    .setLabel("What task did you just complete?")
                    .setPlaceholder("All of the devious english homework")
                    .setStyle("SHORT")
                    .setRequired(true)
                    .setCustomId("task")
            )
        await showModal(modal, {client: interaction.client, interaction});
        interaction.replied = true;
        return true
    })
    .addModalHandler<{cmd: string, sessionId: string}>(async (interaction, {data}) => {
        if(data.cmd !== "submit_completed_task") return;
        let task = interaction.getTextInputValue("task");
        await prisma.sessionParticipant.upsert({
            where:{ userId_sessionId:{
                userId: interaction.user.id,
                sessionId: data.sessionId
            }},
            update:{
                tasksCompleted: {
                    push: task
                }
            },
            create:{
                timeCompleted: 0,
                userId: interaction.user.id,
                sessionId: data.sessionId
            }
        })
        await interaction.reply({ephemeral: true, embeds:[
            new MessageEmbed()
                .setTitle("Task saved")
                .setColor(Colors.success)
                .setDescription("Your task has been successfully saved, and you held yourself accountable for what you did in the last 25 minutes!")
                .setFooter({text:`Session ID: ${data.sessionId}`, iconURL:interaction.client.user?.avatarURL() || ""})
        ]})
        return true;
    })
    .addButtonHandler<{cmd: string, sessionId: string}>(async (interaction, {data}) => {
        if(data.cmd !== "update_pomodoro_embed_status") return;
        let session = Pomodoro.active.find(session => session.id === data.sessionId);
        if(!session){
            await interaction.update({embeds:[Embeds.EXPIRED_COMPONENT]})
            return false;
        }
        session.update();
        await interaction.update(session.getStatusPayload());
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
        .setDescription("Stop the pomodoro session prematurely and terminate it."))