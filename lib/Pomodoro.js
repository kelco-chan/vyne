"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pomodoro = exports.pomoEventEmitter = void 0;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const events_1 = require("events");
const colors_1 = require("../assets/colors");
const config_json_1 = require("../config.json");
const common_tags_1 = require("common-tags");
let activePomodoros = [];
exports.pomoEventEmitter = new events_1.EventEmitter();
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
     * Initialises voice connections properly
     */
    async initVoice() {
        this.connection.on(voice_1.VoiceConnectionStatus.Disconnected, () => {
            this.destroy();
            exports.pomoEventEmitter.emit("abort", this);
        });
        this.playAlarm();
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
     * Updates the status of the current pomodoro
     */
    update() {
        if (this.paused)
            return;
        this.timeCompleted += Date.now() - this.lastUpdateTime;
        let status = this.getStatus();
        if (status.cycle === 4 && status.type === "BREAK") {
            this.destroy();
        }
        else if (status.timeRemaining < 90) {
            exports.pomoEventEmitter.emit("active", this);
        }
        else if (status.timeRemaining < config_json_1.GLOBAL_TIMER_SWEEP_INTERVAL) {
            this.timeout = setTimeout(() => this.update(), status.timeRemaining - 50);
        }
        this.lastUpdateTime = Date.now();
    }
    /**
     * Returns the status of the current pomodoro
     * @param seekAhead Amount of milliseconds to look into the future. E.g. if `seekAhead` is set to 100ms, this will return the status embed at time Date.now() + 100ms
     * @returns Current status
     */
    getStatus(seekAhead) {
        let timeCompleted = this.timeCompleted + (seekAhead || 0);
        let modulo = timeCompleted % config_json_1.SESSION_DURATION;
        let cycle = Math.floor(timeCompleted / config_json_1.SESSION_DURATION) + 1;
        if (0 <= modulo && modulo < config_json_1.WORK_DURATION) {
            return {
                type: "WORK",
                timeElapsed: modulo,
                timeRemaining: config_json_1.WORK_DURATION - modulo,
                cycle
            };
        }
        else if (config_json_1.WORK_DURATION <= modulo && modulo <= config_json_1.SESSION_DURATION) {
            return {
                type: "BREAK",
                timeElapsed: modulo - config_json_1.WORK_DURATION,
                timeRemaining: config_json_1.SESSION_DURATION - modulo,
                cycle
            };
        }
        else {
            throw new Error("Interesting modulo ...");
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
        let progress = Math.floor(status.timeElapsed / config_json_1.SESSION_DURATION * (message.length - 3));
        if (status.type === "BREAK" && status.cycle === 4) {
            return new discord_js_1.MessageEmbed()
                .setTitle("Session finished")
                .setColor(colors_1.Colors.success)
                .setDescription("The pomodoro session has finished, good job! Take a long break now and come back later to do more pomodoros!");
        }
        return new discord_js_1.MessageEmbed()
            .setTitle(status.type === "WORK" ? "Working" : "Taking a break")
            .setDescription((0, common_tags_1.stripIndents) `\`\`\`less
                ${message}
                [=${"=".repeat(progress)}${" ".repeat(message.length - 3 - progress)}]
                \`\`\``)
            .addField("Elapsed", `${Math.round(status.timeElapsed / 60000)}m`, true)
            .addField("Remaining", `${Math.round(status.timeRemaining / 60000)}m`, true)
            .addField("Cycle", `${status.cycle}/4`, true)
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
     * Finds a pomodoro session based on voice channe;
     * @param vcId voice channel of the desired pomodoro session
     * @returns if exists, the corresponding pomodoro session
     */
    static find(vcId) {
        return activePomodoros.find(pomo => pomo.vcId === vcId);
    }
    /**
     * Batch updates all pomodoro sessions. See `Pomodoro#update` for more information
     */
    static updateAll() {
        for (let pomo of activePomodoros) {
            pomo.update();
        }
    }
    /**
     * Sets up updates that are triggered by timers AND NOT BY COMMAND INTERACTIONS
     * @param client The client used to deliver alarms
     */
    static bindClient(client) {
        exports.pomoEventEmitter.on("active", async (session) => {
            if (!session.interaction.channel)
                return;
            session.playAlarm();
            let payload = { embeds: [session.getStatusEmbed(91)] };
            if (!session.lastMessageUpdate) {
                //no msg updates sent yet, invalidate the original interaction
                session.interaction.editReply({ embeds: [], content: "<:invis:962267696966283284>" });
            }
            else {
                //delete last update
                session.lastMessageUpdate.delete();
            }
            session.lastMessageUpdate = await session.interaction.channel.send(payload);
        });
        exports.pomoEventEmitter.on("abort", async (session) => {
            if (!session.interaction.channel)
                return;
            await session.interaction.channel.send({ embeds: [new discord_js_1.MessageEmbed()
                        .setTitle("Session aborted")
                        .setColor(colors_1.Colors.error)
                        .setDescription(`The pomodoro session in <#${session.vcId}> has been aborted due to voice channel errors. Please start another session`)
                ] });
        });
    }
}
exports.Pomodoro = Pomodoro;
setInterval(() => Pomodoro.updateAll(), config_json_1.GLOBAL_TIMER_SWEEP_INTERVAL);
//# sourceMappingURL=Pomodoro.js.map