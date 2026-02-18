import { EventEmitter } from 'events';

export class Mutex {
    private localMutex = false;
    private queue: EventEmitter = new EventEmitter();

    acquire(): Promise<() => void> {
        return new Promise((resolve) => {
            const tryAcquire = () => {
                if (!this.localMutex) {
                    this.localMutex = true;
                    resolve(this.release.bind(this));
                } else {
                    this.queue.once('release', tryAcquire);
                }
            };
            tryAcquire();
        });
    }

    private release() {
        this.localMutex = false;
        this.queue.emit('release');
    }
}
