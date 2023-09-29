import { AddressMonitor } from './AddressMonitor';
import { TaskQueue } from './TaskQueue';

export class WorkerPool {
    private workerCount: number;
    private taskQueue: TaskQueue<string>;

    constructor(workerCount: number) {
        this.workerCount = workerCount;
        this.taskQueue = new TaskQueue();
    }

    public start(addresses: string[]) {
        this.taskQueue.enqueueMultiple(addresses);

        // Start the worker tasks
        for (let i = 0; i < this.workerCount; i++) {
            this.startWorker();
        }
    }

    private startWorker() {
        (async () => {
            while (true) {
                const address = await this.taskQueue.dequeue();
                const monitor = new AddressMonitor(address);
                await monitor.start();
            }
        })().catch(error => console.error('Error in worker task:', error));
    }
}
