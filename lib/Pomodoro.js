"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pomodoro = void 0;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const config_1 = require("../assets/config");
const common_tags_1 = require("common-tags");
let activePomodoros = [];
/**
 * A data structure representing a pomodoro session
 */
class Pomodoro {
    /**
     * Constructor of the pomodoro class
     * @param vcId ID of the vc in which this pomodoro belongs
     * @param interacion The interaction taht initiated this pomodoro session
     * @param guild Guild in which this pomodoro belongs
     */
    constructor(vcId, interaction, guild) {
        this.timeCompleted = 0;
        this.lastUpdateTime = Date.now();
        this.paused = false;
        this.interaction = interaction;
        this.vcId = vcId;
        this.connection = (0, voice_1.joinVoiceChannel)({
            channelId: vcId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator
        });
        this.audioPlayer = (0, voice_1.createAudioPlayer)();
        this.connection.subscribe(this.audioPlayer);
        activePomodoros.push(this);
        console.log(`Created 1 session, ${activePomodoros.length} active`);
    }
    /**
     * Initialises voice connections
     */
    async initVoice() {
        this.playAlarm();
        this.connection.on(voice_1.VoiceConnectionStatus.Disconnected, () => this.abort());
    }
    /**
     * Pauses the pomodoro session
     */
    pause() {
        this.update();
        this.paused = true;
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }
    /**
     * Resumes the pomodoro session
     */
    resume() {
        this.paused = false;
        this.lastUpdateTime = Date.now();
        this.update();
    }
    /**
     * Schedules a callback to be triggered in the future, similar to `setTimeout()`
     * @param cb callback function to be executed
     * @param ms delay in ms
     */
    schedule(cb, ms) {
        if (this.timeout)
            throw new Error("Pomodoro sessions cannot schedule 2 things at the same time");
        this.timeout = setTimeout(() => {
            cb();
            this.timeout = undefined;
        }, ms);
    }
    /**
     * Aborts pomodoro session and display an error status
     */
    async abort() {
        if (!this.interaction.channel)
            return;
        await this.interaction.channel.send({ embeds: [new discord_js_1.MessageEmbed()
                    .setTitle("Session aborted")
                    .setColor(colors_1.Colors.error)
                    .setDescription(`The pomodoro session in <#${this.vcId}> has been aborted due to voice channel errors. Please start another session`)
            ] });
        this.destroy();
    }
    /**
     * Updates the status of the current pomodoro
     */
    update() {
        if (this.paused) {
            this.lastUpdateTime = Date.now();
            return;
        }
        ;
        this.timeCompleted += Date.now() - this.lastUpdateTime;
        let status = this.getStatus();
        if ((status.cycle === 4 && status.type === "BREAK") || status.cycle > 4) {
            this.destroy();
        }
        else if (status.timeRemaining < config_1.GLOBAL_TIMER_SWEEP_INTERVAL) {
            if (!this.timeout) {
                this.schedule(() => { this.update(); this.displayUpdate(true); }, status.timeRemaining - config_1.MAX_TIMER_ALLOWED_ERROR);
            }
        }
        this.lastUpdateTime = Date.now();
    }
    /**
     * Renders and updated to the end user;
     * @param playAlarm whether or not to play an alarm
     */
    async displayUpdate(playAlarm) {
        if (!this.interaction.replied)
            return; //no updates needed if no session initialised yet
        if (playAlarm)
            this.playAlarm();
        //fetch the embed at a later time, just in case things go wrong
        let payload = { embeds: [this.getStatusEmbed(config_1.MAX_TIMER_ALLOWED_ERROR)] };
        //this.interaction.editReply(payload);    
        if (this.lastMessageUpdate) {
            this.lastMessageUpdate.delete();
        }
        this.lastMessageUpdate = await this.interaction.channel?.send(payload);
    }
    /**
     * Returns the status of the current pomodoro
     * @param seekAhead Amount of milliseconds to look into the future. E.g. if `seekAhead` is set to 100ms, this will return the status embed at time Date.now() + 100ms
     * @returns Current status
     */
    getStatus(seekAhead) {
        let timeCompleted = this.timeCompleted + (seekAhead || 0);
        let modulo = timeCompleted % config_1.SESSION_DURATION;
        let cycle = Math.floor(timeCompleted / config_1.SESSION_DURATION) + 1;
        if (0 <= modulo && modulo < config_1.WORK_DURATION) {
            return {
                type: "WORK",
                timeElapsed: modulo,
                timeRemaining: config_1.WORK_DURATION - modulo,
                cycle
            };
        }
        else if (config_1.WORK_DURATION <= modulo && modulo <= config_1.SESSION_DURATION) {
            return {
                type: "BREAK",
                timeElapsed: modulo - config_1.WORK_DURATION,
                timeRemaining: config_1.SESSION_DURATION - modulo,
                cycle
            };
        }
        else {
            throw new Error(`Interesting modulo of ${modulo} ...`);
        }
    }
    /**
     * Generates a message embed description of current pomodoro status
     * @param seekAhead Amount of milliseconds to look into the future. E.g. if `seekAhead` is set to 100ms, this will return the status embed at time Date.now() + 100ms
     * @returns Message embed description of the current pomodoro status
     */
    getStatusEmbed(seekAhead) {
        let status = this.getStatus(seekAhead);
        let message = status.type === "WORK" ? "Keep up the studying and don't you dare get off task 😠" : "Get away from the screen and take a break rofl";
        let progress = Math.floor(status.timeElapsed / (status.timeElapsed + status.timeRemaining) * (message.length - 3));
        if (status.type === "BREAK" && status.cycle === 4) {
            return new discord_js_1.MessageEmbed()
                .setTitle("Session finished")
                .setColor(colors_1.Colors.success)
                .setDescription("The pomodoro session has finished, good job! Take a long break now and come back later to do more pomodoros!");
        }
        return new discord_js_1.MessageEmbed()
            .setTitle(status.type === "WORK" ? "Working ..." : "Taking a break ...")
            .setDescription((0, common_tags_1.stripIndents) `\`\`\`less
                ${message}
                [=${"=".repeat(progress)}${" ".repeat(message.length - 3 - progress)}]
                \`\`\``)
            .addField("Cycle", `${status.cycle}/4`, true)
            .addField("Elapsed", `${Math.round(status.timeElapsed / 60000)}m`, true)
            .addField("Remaining", `${Math.round(status.timeRemaining / 60000)}m`, true)
            .setFooter({ text: `Status last updated on ${new Date().toLocaleTimeString("en-US")}`, iconURL: (this.interaction.client.user?.avatarURL() || "") })
            .setColor(colors_1.Colors.success);
    }
    /**
     * Destroys current pomodoro session and frees up memory
     */
    destroy() {
        this.connection.destroy();
        //@ts-ignore
        this.audioPlayer = null; //manually delete this property
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        activePomodoros = activePomodoros.filter(pomo => pomo != this);
        console.log(`Destroyed 1 session, ${activePomodoros.length} remain`);
    }
    /**
     * Plays the alarm tune on the VC
     */
    playAlarm() {
        this.audioPlayer.play((0, voice_1.createAudioResource)(`${__dirname}/../assets/notif.wav`));
    }
    /**
     * A list of active pomodoros
     */
    static get active() {
        return activePomodoros;
    }
    /**
     * Batch updates all pomodoro sessions. See `Pomodoro#update` for more information
     */
    static async updateAll() {
        console.log(`Batch updating ${activePomodoros.length} sessions`);
        for (let pomo of activePomodoros) {
            if (pomo.paused)
                continue;
            await pomo.update();
            await pomo.displayUpdate(false);
        }
    }
}
exports.Pomodoro = Pomodoro;
setInterval(() => Pomodoro.updateAll(), config_1.GLOBAL_TIMER_SWEEP_INTERVAL);
//# sourceMappingURL=Pomodoro.js.map