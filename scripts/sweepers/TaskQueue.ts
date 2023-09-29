export class TaskQueue<T> {
    private queue: T[] = [];
    private resolveQueue: Array<(value: T) => void> = [];

    public enqueue(item: T) {
        if (this.resolveQueue.length > 0) {
            const resolve = this.resolveQueue.shift()!;
            resolve(item);
        } else {
            this.queue.push(item);
        }
    }

    public enqueueMultiple(items: T[]) {
        items.forEach(item => this.enqueue(item));
    }

    public async dequeue(): Promise<T> {
        if (this.queue.length > 0) {
            return this.queue.shift()!;
        } else {
            return new Promise(resolve => this.resolveQueue.push(resolve));
        }
    }
}
