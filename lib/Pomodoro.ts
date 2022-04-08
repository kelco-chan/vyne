import { EventEmitter } from "events";
let activePomodoros = [];
type PomodoroEvent = "15_MINS_BEFORE_BREAK" | "5_MINS_BEFORE_BREAK" | "BREAK" | "NEXT_CYCLE";
class Pomodoro extends EventEmitter{
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
    constructor(){
        super();
        this.timeCompleted = 0;
        this.lastUpdateTime = Date.now();
        this.paused = false;
    }
    /**
     * Pauses the pomodoro session
     */
    pause(){
        this.lastUpdateTime = Date.now();
        this.paused = true;
    }
    /**
     * Updates the status of the current pomodoro
     */
    update(){
        if(!this.paused){
            this.timeCompleted += Date.now() - this.lastUpdateTime;
        }
        this.lastUpdateTime = Date.now();
    }
}