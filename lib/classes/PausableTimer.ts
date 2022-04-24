export default class PausableTimer{
    /**
     * Previously counted amount of time (ie total time before most recent pause)
     */
    private count: number;
    /**
     * The time where this timer;
     */
    lastResumed?: number;
    constructor(){
        this.count = 0;
        this.resume();
    }
    resume(){
        if(this.lastResumed) return;//alrready resumed, no need to resume twice
        this.lastResumed = Date.now();
    }
    pause(){
        if(!this.lastResumed) return;//timer already paused, don't pause again
        this.count += (Date.now() - this.lastResumed);
        this.lastResumed = undefined;
    }
    get elapsed(){
        return this.count + (this.lastResumed ? Date.now() - this.lastResumed : 0);
    }
}