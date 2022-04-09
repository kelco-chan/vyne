import { AudioPlayer, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Client, CommandInteraction, Guild, Interaction, Message, MessageEmbed, TextChannel } from "discord.js";
import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";
import { Colors } from "../assets/colors";
import { GLOBAL_TIMER_SWEEP_INTERVAL, SESSION_DURATION, WORK_DURATION } from "../assets/config";
import { stripIndents } from "common-tags"
type PomodoroEvent = {
    passive: (session: Pomodoro) => any;
    active: (session: Pomodoro) => any;
    abort: (session: Pomodoro) => any;
}
type PomodoroStatus = {
    type:"BREAK" | "WORK",
    timeElapsed: number,
    timeRemaining: number,
    cycle: number
}

let activePomodoros:Pomodoro[] = [];
export const pomoEventEmitter = new EventEmitter() as TypedEmitter<PomodoroEvent>;
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
     * Initialises voice connections properly
     */
    async initVoice(){
        this.connection.on(VoiceConnectionStatus.Disconnected, () => {
            this.destroy();
            pomoEventEmitter.emit("abort", this);
        });
        this.playAlarm();
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
     * Updates the status of the current pomodoro
     */
    update(){
        if(this.paused) return;
        this.timeCompleted += Date.now() - this.lastUpdateTime;
        let status = this.getStatus();
        if(status.cycle === 4 && status.type === "BREAK"){
            this.destroy();
        }else if(status.timeRemaining < 90){
            pomoEventEmitter.emit("active", this)
        }else if(status.timeRemaining < GLOBAL_TIMER_SWEEP_INTERVAL){
            this.timeout = setTimeout(() => this.update(), status.timeRemaining - 50);
        }
        this.lastUpdateTime = Date.now();
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
            throw new Error("Interesting modulo ...")
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
        let progress = Math.floor(status.timeElapsed / SESSION_DURATION * (message.length - 3));
        if(status.type === "BREAK" && status.cycle === 4){
            return new MessageEmbed()
                .setTitle("Session finished")
                .setColor(Colors.success)
                .setDescription("The pomodoro session has finished, good job! Take a long break now and come back later to do more pomodoros!")
        }
        return new MessageEmbed()
            .setTitle(status.type === "WORK" ? "Working" : "Taking a break")
            .setDescription(stripIndents`\`\`\`less
                ${message}
                [=${"=".repeat(progress)}${" ".repeat(message.length-3-progress)}]
                \`\`\``)
            .addField("Elapsed", `${Math.round(status.timeElapsed/60000)}m`, true)
            .addField("Remaining", `${Math.round(status.timeRemaining/60000)}m`, true)
            .addField("Cycle", `${status.cycle}/4`, true)
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
     * Finds a pomodoro session based on voice channe;
     * @param vcId voice channel of the desired pomodoro session
     * @returns if exists, the corresponding pomodoro session
     */
    static find(vcId: string): Pomodoro|undefined{
        return activePomodoros.find(pomo => pomo.vcId === vcId);
    }
    /**
     * Batch updates all pomodoro sessions. See `Pomodoro#update` for more information
     */
    static updateAll(){
        for(let pomo of activePomodoros){
            pomo.update();
        }
    }
    /**
     * Sets up updates that are triggered by timers AND NOT BY COMMAND INTERACTIONS
     * @param client The client used to deliver alarms
     */
    static bindClient(client: Client){
        pomoEventEmitter.on("active", async (session) => {
            if(!session.interaction.channel) return;
            session.playAlarm();
            let payload = {embeds:[session.getStatusEmbed(91)]};
            if(!session.lastMessageUpdate){
                //no msg updates sent yet, invalidate the original interaction
                session.interaction.editReply({embeds:[], content:"<:invis2:962287384513355806>"});
            }else{
                //delete last update
                session.lastMessageUpdate.delete();
            }
            session.lastMessageUpdate = await session.interaction.channel.send(payload);
        });
        pomoEventEmitter.on("abort", async session => {
            if(!session.interaction.channel) return;
            await session.interaction.channel.send({embeds:[new MessageEmbed()
                .setTitle("Session aborted")
                .setColor(Colors.error)
                .setDescription(`The pomodoro session in <#${session.vcId}> has been aborted due to voice channel errors. Please start another session`)
            ]})
        })
    }
}
setInterval(() => Pomodoro.updateAll(), GLOBAL_TIMER_SWEEP_INTERVAL);