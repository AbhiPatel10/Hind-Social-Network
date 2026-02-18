"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = void 0;
const events_1 = require("events");
class Mutex {
    constructor() {
        this.localMutex = false;
        this.queue = new events_1.EventEmitter();
    }
    acquire() {
        return new Promise((resolve) => {
            const tryAcquire = () => {
                if (!this.localMutex) {
                    this.localMutex = true;
                    resolve(this.release.bind(this));
                }
                else {
                    this.queue.once('release', tryAcquire);
                }
            };
            tryAcquire();
        });
    }
    release() {
        this.localMutex = false;
        this.queue.emit('release');
    }
}
exports.Mutex = Mutex;
