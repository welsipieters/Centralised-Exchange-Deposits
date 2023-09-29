import 'reflect-metadata';
import express from 'express';
import { initializeDatabase } from './database';
import './controllers/DepositAddressController';
import {container} from "./inversify.config";
import {DepositAddressRoutes} from "./controllers/DepositAddressController";
import 'dotenv/config';

// Create server

const main = async () => {
    await initializeDatabase();
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