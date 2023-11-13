import {container} from "../inversify.config";
import {IBlockchainService, IDatabaseService} from "../interfaces";
import types from "../types";
import 'dotenv/config';


export default async function () {
    const databaseService = container.get<IDatabaseService>(types.Database);
    const sweeps = await databaseService.fetchSweepsWithUnconfirmedTransaction()

    for (const sweep of sweeps) {
        console.log(`Checking sweep transaction ${sweep.sweepHash}`)
        try {
            let blockchainService = container.get<IBlockchainService>(types.Blockchain);
            const confirmations = await blockchainService.getTransactionConfirmations(sweep.sweepHash);
            console.log(`Sweep transaction ${sweep.sweepHash} has ${confirmations} confirmations`
            )
            if (confirmations >= process.env.MIN_CONFIRMATIONS) {
                console.log(`Sweep transaction ${sweep.sweepHash} has ${confirmations} confirmations. Updating sweep as confirmed`);
                await databaseService.updateSweepConfirmed(sweep.id);

            }
        } catch (error) {
            console.error(`Error checking sweep transaction ${sweep.sweepHash}:`, error);
        }
    }
}