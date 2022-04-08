"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
let activePomodoros = [];
class Pomodoro extends events_1.EventEmitter {
    constructor() {
        super();
        this.timeCompleted = 0;
        this.lastUpdateTime = Date.now();
        this.paused = false;
    }
    /**
     * Pauses the pomodoro session
     */
    pause() {
        this.lastUpdateTime = Date.now();
        this.paused = true;
    }
    /**
     * Updates the status of the current pomodoro
     */
    update() {
        if (!this.paused) {
            this.timeCompleted += Date.now() - this.lastUpdateTime;
        }
        this.lastUpdateTime = Date.now();
    }
}
//# sourceMappingURL=Pomodoro.js.map