import express from 'express';
import { Container } from 'inversify';
import { IBlockchainService, IDatabaseService } from '../interfaces';
import types from '../types';

export function DepositAddressRoutes(container: Container): express.Router {
    const router = express.Router();
    const blockchainService = container.get<IBlockchainService>(types.Blockchain);
    const databaseService = container.get<IDatabaseService>(types.Database);

    router.post('/generate/:count', async (req, res) => {
        const count = parseInt(req.params.count, 10);
        const addresses = await blockchainService.generateAddresses(count);
        for (const address of addresses) {
            await databaseService.saveAddress(address);
        }
        res.json({ success: true, addresses });
    });

    router.get('/unused', async (req, res) => {
        const addressEntity = await databaseService.fetchAndMarkUnusedAddress();
        if (!addressEntity) {
            res.status(404).json({ success: false, message: "No unused address found" });
            return;
        }
        res.json({ success: true, address: addressEntity.deposit_address });
    });

    return router;
}
