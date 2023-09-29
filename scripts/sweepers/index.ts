import { AddressMonitor } from './AddressMonitor';
import { loadAddressesFromDB } from './Database';
import { WorkerPool } from './WorkerPool';

const WORKER_COUNT = 10;
async function main() {
    const addresses = await loadAddressesFromDB();

    const workerPool = new WorkerPool(WORKER_COUNT); // for example, 10 workers

    workerPool.start(addresses);
}

main().catch(console.error);
