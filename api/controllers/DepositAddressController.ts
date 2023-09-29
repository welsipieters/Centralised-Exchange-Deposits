import express from 'express';
import { Container } from 'inversify';
import { IBlockchainService, IDatabaseService } from '../interfaces';
import types from '../types';

/**
 * Initializes and returns the router for deposit address routes.
 * @param container - The InversifyJS container to resolve dependencies.
 * @returns The configured Express router.
 */
export function DepositAddressRoutes(container: Container): express.Router {
    const router = express.Router();
    const blockchainService = container.get<IBlockchainService>(types.Blockchain);
    const databaseService = container.get<IDatabaseService>(types.Database);

    /**
     * Route to generate deposit addresses.
     * @param count - The number of addresses to generate.
     * @returns The transaction hash of the generation transaction.
     */
    router.post('/generate/:count', async (req, res) => {
        try {
            const count = parseInt(req.params.count, 10);
            if (isNaN(count) || count <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid count parameter' });
            }

            const txHash = await blockchainService.generateAddresses(count);
            console.log('Generating addresses. Tx hash:', txHash);

            return res.status(200).json({ success: true, txHash });
        } catch (error) {
            console.error('Error generating or saving addresses:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    /**
     * Route to get an unused deposit address and mark it as used.
     * @returns The unused deposit address.
     */
    router.get('/unused', async (req, res) => {
        try {
            const addressEntity = await databaseService.fetchAndMarkUnusedAddress();
            if (!addressEntity) {
                return res.status(404).json({ success: false, message: 'No unused address found' });
            }

            return res.status(200).json({ success: true, address: addressEntity.deposit_address });
        } catch (error) {
            console.error('Error fetching unused address:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    return router;
}
