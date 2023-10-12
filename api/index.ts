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
    knakenURL: 'https://api.dev.knaken.eu/api/',
    keys: {
        core: 'zq9i6UhkEz39oXJNjnua6kNPqUJkqbeVYmF69AFVNz3b97dbtuJsBCY27228LP7N',
        admin: 'rOd51HU38leItTXBxL2Jvc8bO8V64vfxDBLQeieUff5ONwxUGYM9tpRvkUP9AX9D',
    }
};




cron.schedule('*/5 * * * *', () => postSweepTransactions(config));





cron.schedule('*/1 * * * *', () => fetchAddressesFromExternalAPI(config));  // Schedule the task to run every 1 minute


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

