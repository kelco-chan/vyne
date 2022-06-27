import { SlashCommandBuilder } from "@discordjs/builders";
import { InteractionReplyOptions, Message, MessageActionRow, MessageEmbed, Modal, ModalActionRowComponent, TextInputComponent } from "discord.js";
import { Colors } from "../assets/colors";
import { Embeds } from "../assets/embeds";
import { addButtonHandler, addCommandHandler, addModalSubmitHandler } from "../lib/classes/Command";
import { cache, resolveEntry } from "../lib/classes/InteractionCache";
import { Pomodoro } from "../lib/classes/Pomodoro";
import prisma from "../lib/common/prisma";

export default new SlashCommandBuilder()
    .setName("pomo")
    .setDescription("Commands for setting up a pomodoro timer")
    .addSubcommand(subcmd => subcmd
        .setName("start")
        .setDescription("Start a new pomodoro session (4x25mins)"))
    .addSubcommand(subcmd => subcmd
        .setName("status")
        .setDescription("Shows the status of the current pomodoro session"))

addCommandHandler(/^pomo/, async (interaction) => {
    if(!interaction.member || !interaction.inCachedGuild()){
        await interaction.reply({embeds:[Embeds.SERVER_ONLY]});
        return "ERROR";
    }
    let vcId = interaction.member.voice.channelId;
    if(!vcId){
        await interaction.reply({embeds:[new MessageEmbed()
            .setTitle("Please join a VC")
            .setColor(Colors.error)
            .setDescription("Please join a voice channel to use pomodoro timers")
        ]});
        return "ERROR";
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
            return "ERROR";
        }
        if(!interaction.channel) return "ERROR";
        let perms = interaction.guild.me?.permissionsIn(interaction.channel);
        if(!perms) return "ERROR";
        if(!perms.has("VIEW_CHANNEL")){
            await interaction.reply({embeds:[Embeds.PRIVATE_TEXT_CHANNEL(interaction.channelId)]});
            return "ERROR";
        }
        if(!perms.has("SEND_MESSAGES")){
            await interaction.reply({embeds:[Embeds.INSUFFICIENT_PERMS]});
            return "ERROR";
        }
        if(!interaction.member.voice.channel) return "ERROR";
        let vPerms = interaction.guild.me?.permissionsIn(interaction.member.voice.channel);
        if(!vPerms) return "ERROR";
        if(!vPerms.has("VIEW_CHANNEL")){
            await interaction.reply({embeds:[Embeds.PRIVATE_Voice_CHANNEL(vcId)]})
            return "ERROR";
        }
        let pomo = new Pomodoro(vcId, interaction, interaction.guild);
        pomo.init()
        await interaction.reply({
            content:"Starting pomodoro session ... (a new message should appear below shortly)",
            ephemeral: true
        })
        try{
            await pomo.displayUpdate();
        }catch(e){
            await interaction.followUp({embeds:[
                new MessageEmbed()
                    .setTitle("Unknown Error")
                    .setDescription("Something stopped us from setting up pomodoro timers. Please try again or check that Vyne has sufficient permissions to set up the pomodoro timers.")
                    .setColor(Colors.error)
            ]})
            pomo.destroy();
            return "ERROR";    
        }
        return "SUCCESS";
    }else if(subcmd === "status"){
        if(!currentSession){
            await interaction.reply({embeds:[
                new MessageEmbed()
                    .setTitle("No session running")
                    .setColor(Colors.error)
                    .setDescription("There are no active pomodoro sessions in this voice channel right now to query nor modify. Please start one using `/pomo start`")
            ]});
            return "ERROR";
        }
        if(currentSession.vcId !== interaction.member.voice.channelId){
            await interaction.reply({embeds:[
                new MessageEmbed()
                    .setTitle("Session isn't here")
                    .setColor(Colors.error)
                    .setDescription(`The pomodoro session is currently active in <#${currentSession.vcId}>. Please join that voice channel instead to use pomodoro timers`)
            ]});
            return "ERROR";
        }
        currentSession.update();
        let message = await interaction.reply({...currentSession.getStatusPayload(), fetchReply: true});
        if(currentSession.lastMessageUpdate){
            currentSession.lastMessageUpdate.delete().catch(e => e);
            currentSession.lastMessageUpdate = message;
        }
        return "SUCCESS";
    }else{
        throw new Error(`Unknown subcommand ${interaction.options.getSubcommand()}`)
    }
})

addModalSubmitHandler<{cmd: string, sessionId: string}>(async (interaction, {data}) => {
    if(data.cmd !== "submit_completed_task") return "NO_MATCH";
    let task = interaction.fields.getTextInputValue("task");
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
    return "SUCCESS";
})

addButtonHandler<{cmd: string, sessionId: string}>(async (interaction, {data}) => {
    if((data.cmd !== "resume_pomodoro") && (data.cmd !== "pause_pomodoro") && (data.cmd !== "stop_pomodoro")) return "NO_MATCH";
    if(!interaction || !interaction.inCachedGuild()){
        await interaction.reply({embeds:[Embeds.SERVER_ONLY]});
        return "ERROR";
    }
    let session = Pomodoro.active.find(session => session.id === data.sessionId);
    if(!session){
        await interaction.reply({embeds:[Embeds.EXPIRED_SESSION]})
        return "ERROR";
    }
    if(interaction.member.voice.channelId !== session.vcId){
        await interaction.reply({embeds:[
            new MessageEmbed()
                .setTitle("Join the voice channel")
                .setColor(Colors.error)
                .setDescription(`The pomodoro session is currently active in <#${session.vcId}>. Please join that voice channel instead to use pomodoro timers`)
                .setFooter({text:`Session ID: ${session.id} · Voice channel: ${session.vcId}`})
        ]});
        return "ERROR";
    }
    if(data.cmd === "pause_pomodoro"){
        session.pause();
    }else if(data.cmd === "resume_pomodoro"){
        session.resume();
    }else if(data.cmd === "stop_pomodoro"){
        session.destroy();
    }
    let payload = session.getStatusPayload() as {embeds: MessageEmbed[], components: MessageActionRow[]};
    if(data.cmd === "stop_pomodoro"){
        payload.embeds[0] = new MessageEmbed()
            .setTitle("Session stopped")
            .setColor(Colors.error)
            .setDescription(`The session in <#${session.vcId}> has been successfully stopped.`)
        payload.components = [];
    }
    session.update();
    await interaction.update(payload);
    return "SUCCESS";
})

addButtonHandler<{cmd: string, sessionId: string}>(async (interaction, {data}) => {
    if(data.cmd !== "prompt_completed_task") return "NO_MATCH";
    let modal = new Modal()
        .setTitle("Task Completion Check")
        .setCustomId(cache({cmd:"submit_completed_task", sessionId:data.sessionId}, {users:[interaction.user.id], duration:3 * 60_000}))
        .addComponents(
            new MessageActionRow<ModalActionRowComponent>().addComponents(
                new TextInputComponent()
                    .setLabel("What task did you just complete?")
                    .setPlaceholder("All of the devious english homework")
                    .setStyle("SHORT")
                    .setRequired(true)
                    .setCustomId("task")
            )
        )
    await interaction.showModal(modal);
    return "SUCCESS";
})
addButtonHandler<{cmd: string, sessionId: string}>(async (interaction, {data}) => {
    if(data.cmd !== "update_pomodoro_embed_status") return "NO_MATCH";
    let session = Pomodoro.active.find(session => session.id === data.sessionId);
    if(!session){
        await interaction.update({embeds:[Embeds.EXPIRED_COMPONENT]})
        return "ERROR";
    }
    session.update();
    await interaction.update(session.getStatusPayload());
    return "SUCCESS";
})