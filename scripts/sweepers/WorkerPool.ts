import { AddressMonitor } from './AddressMonitor';
import { TaskQueue } from './TaskQueue';
import {DepositAddress} from "../../shared/models/DepositAddress";

export class WorkerPool {
    private workerCount: number;
    private taskQueue: TaskQueue<DepositAddress[]>;
    private static BATCH_SIZE = 100;

    constructor(workerCount: number) {
        this.workerCount = workerCount;
        this.taskQueue = new TaskQueue();
    }

    public start(addresses: DepositAddress[]) {
        // Divide the addresses into batches
        const batches: DepositAddress[][] = [];
        for (let i = 0; i < addresses.length; i += WorkerPool.BATCH_SIZE) {
            batches.push(addresses.slice(i, i + WorkerPool.BATCH_SIZE));
        }

        this.taskQueue.enqueueMultiple(batches);

        // Start the worker tasks
        for (let i = 0; i < this.workerCount; i++) {
            this.startWorker();
        }
    }

    private startWorker() {
        (async () => {
            while (true) {
                const batch = await this.taskQueue.dequeue();

                if (!batch) {
                    break;  // No more batches left to process
                }

                // Create a monitor for the entire batch
                const monitor = new AddressMonitor(batch);

                await monitor.start();
            }
        })().catch(error => console.error('Error in worker task:', error));
    }
}
