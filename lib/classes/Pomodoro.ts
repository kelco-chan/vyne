import { AudioPlayer, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import {  BaseGuildVoiceChannel, CommandInteraction, CommandInteractionOptionResolver, Guild, GuildMember, Interaction, InteractionReplyOptions, Message, MessageActionRow, MessageButton, MessageEmbed, ThreadChannel, VoiceChannel } from "discord.js";
import { Colors } from "../../assets/colors";
import { GLOBAL_TIMER_SWEEP_INTERVAL, MAX_TIMER_ALLOWED_ERROR, SESSION_DURATION, WORK_DURATION } from "../../assets/config";
import { cache } from "./InteractionCache";
import { nanoid } from "nanoid";
import prisma from "../common/prisma";
import PausableTimer from "./PausableTimer";
import { PrismaClientUnknownRequestError } from "@prisma/client/runtime";
import client from "../common/client";
import { relativeTimestamp } from "../helpers/timestamp";

type PomodoroStatus = {
    /**
     * The current section that the session is in
     */
    type:"BREAK" | "WORK",
    /**
     * Time elapsed in the current section
     */
    timeElapsed: number,
    /**
     * Time remaining until next work/break section
     */
    timeRemaining: number,
    /**
     * Current cycle (1-4)
     */
    cycle: number
} | {
    type : "FINISHED"
}
let activePomodoros:Pomodoro[] = [];
/**
 * A data structure representing a pomodoro session
 */
export class Pomodoro{
    /**
     * ID of this pomodoro session
     */
    id: string;
    /**
     * Number of milliseconds completed in this pomodoro session
     */
    timeCompleted: number;
    /**
     * Timestamp of when this pomodoro was last checked
     */
    lastUpdateTime: number;
    /**
     * Shows if the current session is paused
     */
    paused: boolean;
    /**
     * Voice connection of this pomodoro
     */
    connection: VoiceConnection
    /**
     * Audio player used to play alarms
     */
    audioPlayer: AudioPlayer;
    /**
     * ID of the vc of which the pomo session is in
     */
    vcId: string;
    /**
     * ID of current timeout
     */
    timeout?: NodeJS.Timeout
    /**
     * The original interaction that triggered this pomodoro
     */
    interaction: CommandInteraction;
    /**
     * Last message that was sent as an update to the pomodoro session
     */
    lastMessageUpdate?: Message;
    /**
     * List of timers to track the time spent by each individual user;
     */
    userTimers: Map<string, PausableTimer>
    /**
     * Constructor of the pomodoro class
     * @param vcId ID of the vc in which this pomodoro belongs
     * @param interaction The interaction taht initiated this pomodoro session
     * @param guild Guild in which this pomodoro belongs
     */
    constructor(vcId: string, interaction: CommandInteraction, guild:Guild){
        this.id = nanoid();
        this.timeCompleted = 0;
        this.userTimers = new Map();
        this.lastUpdateTime = Date.now();
        this.paused = false;
        this.interaction = interaction;
        this.vcId = vcId;
        this.connection = joinVoiceChannel({
            channelId: vcId,
            guildId: guild.id,
            //@ts-ignore wrong djs typings, not problematic
            adapterCreator: guild.voiceAdapterCreator
        });
        this.audioPlayer = createAudioPlayer();
        this.connection.subscribe(this.audioPlayer);
        activePomodoros.push(this);
        console.log(`Pomodoro: create session, ${activePomodoros.length} active`);
    }
    /**
     * Inits the pomodoro session
     */
    async init(){
        this.playAlarm();
        this.connection.on(VoiceConnectionStatus.Disconnected, () => this.abort());
        let members = await this.getCurrentMembers();
        await prisma.session.create({
            data:{
                id: this.id,
                started: new Date(),
                guild:{
                    connectOrCreate: {
                        where:{id: this.interaction.guildId as string},
                        create:{id: this.interaction.guildId as string}
                    }
                },
                vcId: this.vcId,
                participants:{
                    create:members.map(member => ({
                        user: {connectOrCreate: {
                            where: {id: member.user.id},
                            create:{id: member.user.id, joined: new Date()}
                        }},
                        timeCompleted: 0
                    }))
                }
            }
        });
        for(const member of members){
            this.userTimers.set(member.user.id, new PausableTimer());
        }
    }
    /**
     * Pauses the pomodoro session
     */
    pause(){
        this.update();
        this.paused = true;
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        for(let [_, timer] of this.userTimers){
            timer.pause();
        }
    }
    /**
     * Resumes the pomodoro session
     */
    resume(){
        this.paused = false;
        this.lastUpdateTime = Date.now();
        this.update();
        for(let [_, timer] of this.userTimers){
            timer.resume();
        }
    }
    /**
     * Schedules a callback to be triggered in the future, similar to `setTimeout()`
     * @param cb callback function to be executed
     * @param ms delay in ms
     */
    schedule(cb: () => any, ms: number){
        if(this.timeout) throw new Error("Pomodoro sessions cannot schedule 2 things at the same time");
        this.timeout = setTimeout(() => {
            cb();
            this.timeout = undefined;
        }, ms);
    }
    /**
     * Aborts pomodoro session and display an error status
     */
    async abort(){
        if(!this.interaction.channel) return;
        await this.interaction.channel.send({embeds:[new MessageEmbed()
            .setTitle("Session aborted")
            .setColor(Colors.error)
            .setDescription(`The pomodoro session in <#${this.vcId}> has been aborted due to voice channel errors. Please start another session`)
        ]})
        this.destroy();
    }
    /**
     * Updates the status of the current pomodoro
     */
    async update(){
        if(this.paused){
            this.lastUpdateTime = Date.now();
            return;
        };
        this.timeCompleted += Date.now() - this.lastUpdateTime;
        let status = this.getStatus();
        if(status.type === "FINISHED"){
            this.destroy();
            return;
        }else if(status.timeRemaining < GLOBAL_TIMER_SWEEP_INTERVAL){
            if(!this.timeout){
                this.schedule(() => {
                    this.update();
                    this.playAlarm();
                    this.displayUpdate()
                }, status.timeRemaining - MAX_TIMER_ALLOWED_ERROR);
            }
        }
        this.lastUpdateTime = Date.now();
        try{
            await this.upsertParticipantStates();
        }catch(e){
            if(e instanceof PrismaClientUnknownRequestError){
                console.log(`Pomodoro: failed to upsert pariticpant status in session ${this.id}, error is unknown.`)
            }else{
                throw e;
            }
        }
    }
    /**
     * Upsert the states of all participants
     */
    async upsertParticipantStates(){
        for(let [userId, timer] of this.userTimers){
            await prisma.sessionParticipant.upsert({
                where:{ userId_sessionId:{
                    userId: userId,
                    sessionId: this.id
                }},
                update:{
                    timeCompleted: timer.elapsed
                },
                create:{
                    user: {connectOrCreate:{
                        where:{id: userId},
                        create: {id: userId}
                    }},
                    session: {connect:{
                        id: this.id
                    }},
                    timeCompleted: timer.elapsed
                }
            });
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    /**
     * Renders and updated to the end user
     */
    async displayUpdate(){
        if(!this.interaction.replied) return; //no updates needed if no session initialised yet
        //fetch the embed at a later time, just in case things go wrong
        let payload = this.getStatusPayload(MAX_TIMER_ALLOWED_ERROR)
        //this.interaction.editReply(payload);    
        if(this.lastMessageUpdate){
            this.lastMessageUpdate.delete().catch(e => e);
        }
        this.lastMessageUpdate = await this.interaction.channel?.send(payload);
        
}
    /**
     * Returns the status of the current pomodoro
     * @param seekAhead Amount of milliseconds to look into the future. E.g. if `seekAhead` is set to 100ms, this will return the status embed at time Date.now() + 100ms
     * @returns Current status
     */
    getStatus(seekAhead?: number): PomodoroStatus{
        let timeCompleted = this.timeCompleted + (seekAhead || 0);
        let modulo = timeCompleted % SESSION_DURATION;
        let cycle = Math.floor(timeCompleted / SESSION_DURATION) + 1;
        if((cycle === 4 && (WORK_DURATION <= modulo && modulo <= SESSION_DURATION)) || (cycle > 4)){
            return {
                type: "FINISHED"
            }
        }
        if(0 <= modulo && modulo < WORK_DURATION){
            return {
                type: "WORK",
                timeElapsed: modulo,
                timeRemaining: WORK_DURATION - modulo,
                cycle
            }
        }else if(WORK_DURATION <= modulo && modulo <= SESSION_DURATION){
            return {
                type: "BREAK",
                timeElapsed: modulo - WORK_DURATION,
                timeRemaining: SESSION_DURATION - modulo,
                cycle
            }
        }else{
            throw new Error("Unreachable code reached")
        }
    }
    /**
     * Generates a message embed description of current pomodoro status
     * @param seekAhead Amount of milliseconds to look into the future. E.g. if `seekAhead` is set to 100ms, this will return the status embed at time Date.now() + 100ms
     * @returns Message embed description of the current pomodoro status
     */
    getStatusPayload(seekAhead?: number): {embeds: MessageEmbed[], components: MessageActionRow<any>[]}{
        let status = this.getStatus(seekAhead);
        if(status.type === "FINISHED"){
            return {
                embeds:[
                    new MessageEmbed()
                        .setTitle("Session finished")
                        .setColor(Colors.success)
                        .setDescription("The pomodoro session has finished, good job! Take a long break now and come back later to do more pomodoros. If you found this bot useful, please consider upvoting 👍")],
                components: [new MessageActionRow().addComponents(
                    new MessageButton()
                        .setStyle("LINK")
                        .setLabel("Upvote me on top.gg!")
                        .setURL("https://top.gg/bot/961445600967163954/vote")
                        .setEmoji("👍")
                )]
            }
        }
        let b1 = this.paused ? (
            new MessageButton()
                .setLabel("Resume Session")
                .setStyle("SECONDARY")
                .setEmoji("▶")
                .setCustomId(cache({
                    cmd: "resume_pomodoro",
                    sessionId: this.id
                }, {users:["all"]}))
        ) : (
            new MessageButton()
                .setLabel("Pause Session")
                .setStyle("SECONDARY")
                .setEmoji("⏸")
                .setCustomId(cache({
                    cmd: "pause_pomodoro",
                    sessionId: this.id
                }, {users:["all"]}))
        );
        let buttons = [
            b1,
            new MessageButton()
                .setLabel("Stop session")
                .setStyle("SECONDARY")
                .setCustomId(cache({
                    cmd:"stop_pomodoro",
                    sessionId: this.id
                }, {users:["all"]}))
                .setEmoji("⏹"),
            new MessageButton()
                .setLabel("Update status")
                .setStyle("SECONDARY")
                .setCustomId(cache({
                    cmd: "update_pomodoro_embed_status",
                    sessionId: this.id
                }, {users:["all"]}))
                .setEmoji("🔁")
        ]
        if(status.type === "BREAK"){
            buttons.push(
                new MessageButton()
                .setLabel("Hold yourself accountable")
                .setStyle("SECONDARY")
                .setCustomId(cache({
                    cmd:"prompt_complete_todo_task",
                    sessionId: this.id
                }, {users:["all"], allowRepeatedUsage: true}))
                .setEmoji("📢")
            )
        }
        let message = status.type === "WORK" ? "Keep up the studying and don't you dare get off task 😠" : "Get away from the screen and take a break rofl";
        //!! DANGER - USE TYPE ASSERTION WITH CAUTIOn
        let vc = client.channels.cache.get(this.vcId) as VoiceChannel | undefined;
        return {
            embeds:[
                new MessageEmbed()
                    .setTitle(`Cycle ${status.cycle} of 4: ` + (this.paused ? "Session paused" : status.type === "WORK" ? "Working ..." : "Taking a break ..."))
                    .setDescription(`\`\`\`diff\n+ ${message}\`\`\``)
                    .addField("Started", `${relativeTimestamp(Date.now() - status.timeElapsed)}`, true)
                    .addField("Ending", `${relativeTimestamp(Date.now() + status.timeRemaining)}`, true)
                    .setColor(this.paused ? Colors.error : Colors.success)
                    .setFooter({text: `Currently studying in #${vc?.name} with ${(vc?.members?.size || 1) - 1} people`})
            ],
            components: [new MessageActionRow().addComponents(
                ...buttons
            )]
        }
    }
    /**
     * Destroys current pomodoro session and frees up memory
     */
    destroy(){
        this.connection.destroy();
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        activePomodoros = activePomodoros.filter(pomo => pomo != this);
        //persist information
        (async () => {
            await prisma.session.update({
                where: { id: this.id },
                data:{ ended: new Date() }
            });
            await this.upsertParticipantStates();
            console.log(`Pomodoro: destroy session, ${activePomodoros.length} remain`);
        })() 
    }
    /**
     * Plays the alarm tune on the VC
     */
    playAlarm(){
        this.audioPlayer.play(createAudioResource(`${__dirname}/../../assets/notif.wav`));
    }
    /**
     * A list of active pomodoros
     */
    static get active(){
        return activePomodoros;
    }
    /**
     * Batch updates all pomodoro sessions. See `Pomodoro#update` for more information
     */
    static async updateAll(){
        console.log(`Pomodoro: batch updating ${activePomodoros.length} sessions`)
        for(let pomo of activePomodoros){
            if(pomo.paused) continue;
            await pomo.update();
            await pomo.displayUpdate();
        }
    }
    /**
     * Returns a list of members currently in the pomodoro session.
     * @returns 
     */
    async getCurrentMembers(): Promise<GuildMember[]>{
        let channel = <BaseGuildVoiceChannel> await this.interaction.client.channels.fetch(this.vcId);
        if(!channel) return [];
        return channel.members.toJSON().filter(member => !member.user.bot) || [];
    }

}
setInterval(() => Pomodoro.updateAll(), GLOBAL_TIMER_SWEEP_INTERVAL);

client.on("voiceStateUpdate", async (oldState, newState) => {
    if(newState?.member?.user?.bot || oldState?.member?.user?.bot) return;
    let oldSession = Pomodoro.active.find(session => session.vcId === oldState.channelId);
    let newSession = Pomodoro.active.find(session => session.vcId === newState.channelId);
    if(oldSession && oldState.member){
        //this is the session that was left
        let timer = oldSession.userTimers.get(oldState.member.user.id);
        timer && timer.pause();
        let channel = await client.channels.fetch(oldSession.vcId) as VoiceChannel | null;
        if(channel && (channel.members.size === 1)){
            //everyone left STOP THE SESSION
            oldSession.interaction.channel?.send({embeds:[
                new MessageEmbed()
                .setTitle("Session Stopped")
                .setColor(Colors.error)
                .setDescription("The pomodoro session was stopped since everyone left the voice channel.")
            ]})
            oldSession.destroy();
        }
    }
    if(newSession && newState.member){
        let timer = newSession.userTimers.get(newState.member.user.id);
        if(!timer){
            timer = new PausableTimer();
            newSession.userTimers.set(newState.member.user.id, timer);
        }
        if(newSession.paused){
            timer.pause();
        }else{
            timer.resume();
        }
    }
})