import cron from 'node-cron';
import 'reflect-metadata';
import { WorkerPool } from './WorkerPool';
import {initializeDatabase} from "../../shared/database";
import {container} from "../../api/inversify.config";
import {IDatabaseService} from "../../api/interfaces";
import types from "../../api/types";
import sendMattermostAlert from "../../shared/MatterMost";
import blockchainConfig from "../../shared/blockchainConfig";

const WORKER_COUNT = 10;
let isDatabaseInitialized = false;

async function main() {
    if (!isDatabaseInitialized) {
        await initializeDatabase();
        isDatabaseInitialized = true;
    }


    const databaseService = container.get<IDatabaseService>(types.Database);

    const addresses = await databaseService.fetchAllInUseAddresses();

    const workerPool = new WorkerPool(WORKER_COUNT); // for example, 10 workers

    workerPool.start(addresses);
}

main().catch((e) => {
    sendMattermostAlert(e)
});
cron.schedule('*/1 * * * *', () => {
    main().catch((e) => {
        sendMattermostAlert(e)
    });
});