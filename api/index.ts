import 'reflect-metadata';
import express from 'express';
import { initializeDatabase } from '../shared/database';
import './controllers/DepositAddressController';
import {container} from "./inversify.config";
import {DepositAddressRoutes} from "./controllers/DepositAddressController";
import 'dotenv/config';
import {IBlockchainService, IDatabaseService} from "./interfaces";
import types from "./types";
import cron from 'node-cron';
import env from "hardhat";
import HttpProxyAgent, {HttpsProxyAgent} from 'https-proxy-agent'
import axios from "axios";
import postSweepTransactions from "./crons/postSweepTransaction";
import fetchAddressesFromExternalAPI from "./crons/fetchAddressesFromExternalAPI";

const config = {
    knakenURL: process.env.KNAKEN_URL!,
    keys: {
        core: process.env.CORE_KEY!,
        admin: process.env.ADMIN_KEY!,
    }
};

cron.schedule('*/5 * * * *', () => postSweepTransactions(config));
cron.schedule('*/1 * * * *', () => fetchAddressesFromExternalAPI(config));


const main = async () => {
    await initializeDatabase();

    fetchAddressesFromExternalAPI(config)
    postSweepTransactions(config);

    const app = express();
    app.use('/deposit-addresses', DepositAddressRoutes(container));

    const port = process.env.APP_PORT || 3000;

    app.listen(port, async () => {
        console.log(`Server started on port ${port}`);
    });
};

main().catch((error) => {
    console.error(error);
})

