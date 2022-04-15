import { AudioPlayer, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import {  CommandInteraction, Guild, Message, MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { GLOBAL_TIMER_SWEEP_INTERVAL, MAX_TIMER_ALLOWED_ERROR, SESSION_DURATION, WORK_DURATION } from "../assets/config";
import { stripIndents } from "common-tags"
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
}
let activePomodoros:Pomodoro[] = [];
/**
 * A data structure representing a pomodoro session
 */
export class Pomodoro{
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
     * Constructor of the pomodoro class
     * @param vcId ID of the vc in which this pomodoro belongs
     * @param interacion The interaction taht initiated this pomodoro session
     * @param guild Guild in which this pomodoro belongs
     */
    constructor(vcId: string, interaction: CommandInteraction, guild:Guild){
        this.timeCompleted = 0;
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
        console.log(`Created 1 session, ${activePomodoros.length} active`);
    }
    /**
     * Initialises voice connections
     */
    async initVoice(){
        this.playAlarm();
        this.connection.on(VoiceConnectionStatus.Disconnected, () => this.abort());
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
    }
    /**
     * Resumes the pomodoro session
     */
    resume(){
        this.paused = false;
        this.lastUpdateTime = Date.now();
        this.update();
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
    update(){
        if(this.paused) return;
        this.timeCompleted += Date.now() - this.lastUpdateTime;
        let status = this.getStatus();
        if((status.cycle === 4 && status.type === "BREAK") || status.cycle > 4){
            this.destroy();
        }else if(status.timeRemaining < GLOBAL_TIMER_SWEEP_INTERVAL){
            if(!this.timeout){
                this.schedule(() => {this.update(); this.displayUpdate(true)}, status.timeRemaining - MAX_TIMER_ALLOWED_ERROR);
            }
        }
        this.lastUpdateTime = Date.now();
    }
    /**
     * Renders and updated to the end user;
     * @param playAlarm whether or not to play an alarm
     */
    async displayUpdate(playAlarm?: boolean){
        if(!this.interaction.replied) return; //no updates needed if no session initialised yet
        if(playAlarm) this.playAlarm();
        //fetch the embed at a later time, just in case things go wrong
        let payload = {embeds:[this.getStatusEmbed(MAX_TIMER_ALLOWED_ERROR)]};
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
            throw new Error(`Interesting modulo of ${modulo} ...`)
        }
    }
    /**
     * Generates a message embed description of current pomodoro status
     * @param seekAhead Amount of milliseconds to look into the future. E.g. if `seekAhead` is set to 100ms, this will return the status embed at time Date.now() + 100ms
     * @returns Message embed description of the current pomodoro status
     */
    getStatusEmbed(seekAhead?: number): MessageEmbed{
        let status = this.getStatus(seekAhead);
        let message = status.type === "WORK" ? "Keep up the studying and don't you dare get off task 😠" : "Get away from the screen and take a break rofl";
        let progress = Math.floor(status.timeElapsed / (status.timeElapsed + status.timeRemaining) * (message.length - 3));
        if(status.type === "BREAK" && status.cycle === 4){
            return new MessageEmbed()
                .setTitle("Session finished")
                .setColor(Colors.success)
                .setDescription("The pomodoro session has finished, good job! Take a long break now and come back later to do more pomodoros!")
        }
        return new MessageEmbed()
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
    }
    /**
     * Destroys current pomodoro session and frees up memory
     */
    destroy(){
        this.connection.destroy();
        //@ts-ignore
        this.audioPlayer = null; //manually delete this property
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        activePomodoros = activePomodoros.filter(pomo => pomo != this);
        console.log(`Destroyed 1 session, ${activePomodoros.length} remain`);
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
        console.log(`Batch updating ${activePomodoros.length} sessions`)
        for(let pomo of activePomodoros){
            await pomo.update();
            await pomo.displayUpdate(false);
        }
    }
}
setInterval(() => Pomodoro.updateAll(), GLOBAL_TIMER_SWEEP_INTERVAL);