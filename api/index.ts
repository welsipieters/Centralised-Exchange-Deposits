import 'reflect-metadata'; // Required for inversify
import express from 'express';
import { initializeDatabase } from './database'; // If you have this function to initialize DB
import './controllers/DepositAddressController';
import {container} from "./inversify.config";
import {DepositAddressRoutes} from "./controllers/DepositAddressController"; // This import is crucial as it registers the controller


// Create server
const app = express();

app.use('/deposit-address', DepositAddressRoutes(container));

const port = 3000;

app.listen(port, async () => {
    console.log(`Server started on port ${port}`);
    await initializeDatabase(); // If you have this function to initialize DB
});
