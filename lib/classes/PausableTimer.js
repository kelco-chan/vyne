"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PausableTimer {
    constructor() {
        this.count = 0;
        this.resume();
    }
    resume() {
        if (this.lastResumed)
            return; //alrready resumed, no need to resume twice
        this.lastResumed = Date.now();
    }
    pause() {
        if (!this.lastResumed)
            return; //timer already paused, don't pause again
        this.count += (Date.now() - this.lastResumed);
        this.lastResumed = undefined;
    }
    get elapsed() {
        return this.count + (this.lastResumed ? Date.now() - this.lastResumed : 0);
    }
}
exports.default = PausableTimer;
//# sourceMappingURL=PausableTimer.js.map