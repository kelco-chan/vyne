import { AudioPlayer, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import {  BaseGuildVoiceChannel, CommandInteraction, Guild, GuildMember, Interaction, InteractionReplyOptions, Message, MessageActionRow, MessageButton, MessageEmbed, ThreadChannel } from "discord.js";
import { Colors } from "../../assets/colors";
import { GLOBAL_TIMER_SWEEP_INTERVAL, MAX_TIMER_ALLOWED_ERROR, SESSION_DURATION, WORK_DURATION } from "../../assets/config";
import { stripIndents } from "common-tags"
import { cache } from "./InteractionCache";
import { nanoid } from "nanoid";
import prisma from "../prisma";
import PausableTimer from "./PausableTimer";
import debug from "debug";
import { PrismaClientUnknownRequestError } from "@prisma/client/runtime";
const log = debug("pomodoro");

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
     * The original interaction OR message that triggered this pomodoro
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
     * @param interacion The interaction taht initiated this pomodoro session
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
            adapterCreator: guild.voiceAdapterCreator
        });
        this.audioPlayer = createAudioPlayer();
        this.connection.subscribe(this.audioPlayer);
        activePomodoros.push(this);
        log(`create session: ${activePomodoros.length} active`);
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
                this.schedule(() => {this.update(); this.displayUpdate(true)}, status.timeRemaining - MAX_TIMER_ALLOWED_ERROR);
            }
        }
        this.lastUpdateTime = Date.now();
        try{
            await this.upsertParticipantStates();
        }catch(e){
            if(e instanceof PrismaClientUnknownRequestError){
                log(`failed to upsert pariticpant status in session ${this.id}, error is unknown.`)
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
     * Renders and updated to the end user;
     * @param playAlarm whether or not to play an alarm
     */
    async displayUpdate(playAlarm?: boolean){
        if(!this.interaction.replied) return; //no updates needed if no session initialised yet
        if(playAlarm) this.playAlarm();
        //fetch the embed at a later time, just in case things go wrong
        let payload = this.getStatusPayload(MAX_TIMER_ALLOWED_ERROR)
        //this.interaction.editReply(payload);    
        if(this.lastMessageUpdate){
            this.lastMessageUpdate.delete();
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
    getStatusPayload(seekAhead?: number): InteractionReplyOptions{
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
                )]
            }
        }
        let message = status.type === "WORK" ? "Keep up the studying and don't you dare get off task 😠" : "Get away from the screen and take a break rofl";
        let progress = Math.floor(status.timeElapsed / (status.timeElapsed + status.timeRemaining) * (message.length - 3));
        let buttons = [
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
                    cmd:"prompt_completed_task",
                    sessionId: this.id
                }, {users:["all"]}))
                .setEmoji("📢")
            )
        }
        return {
            embeds:[
                new MessageEmbed()
                    .setTitle(status.type === "WORK" ? "Working ..." : "Taking a break ...")
                    .setDescription(stripIndents`\`\`\`less
                        ${message}
                        [=${"=".repeat(progress)}${" ".repeat(message.length-3-progress)}]
                        \`\`\``)
                    .addField("Cycle", `${status.cycle}/4`, true)
                    .addField("Elapsed", `${Math.round(status.timeElapsed/60000)}m`, true)
                    .addField("Remaining", `${Math.round(status.timeRemaining/60000)}m`, true)
                    .setFooter({text:`Status last updated on ${new Date().toLocaleTimeString("en-US")}`, iconURL: (this.interaction.client.user?.avatarURL() || "")})
                    .setColor(Colors.success)
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
            log(`destroy session: ${activePomodoros.length} remain`);
        })() 
    }
    /**
     * Plays the alarm tune on the VC
     */
    playAlarm(){
        this.audioPlayer.play(createAudioResource(`${__dirname}/../assets/notif.wav`));
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
        log(`batch updating ${activePomodoros.length} sessions`)
        for(let pomo of activePomodoros){
            if(pomo.paused) continue;
            await pomo.update();
            await pomo.displayUpdate(false);
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