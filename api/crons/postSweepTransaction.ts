import {container} from "../inversify.config";
import {IDatabaseService} from "../interfaces";
import types from "../types";
import axios from "axios";

const postSweepTransactions = async (config) => {
    const databaseService = container.get<IDatabaseService>(types.Database);

    const sweepsToNotify = await databaseService.fetchSweepsWithLowNotifications();

    const endpoint = 'create-or-update-deposit';

    const deposits: any[] = [];

    let network = 'ethereum'
    switch (process.env.BLOCKCHAIN_NETWORK) {
        case 'polygon':
            network = 'polygon'
            break;

        default:
            network = 'ethereum'
            break;
    }

    for (const sweep of sweepsToNotify) {
        deposits.push({
            'address': sweep.address,
            'network': network,
            'currency': sweep.token_name,
            'txid': sweep.transactionHash,
            'amount': parseFloat(sweep.amount).toString(),  // assuming amount is a BigNumber or similar
            'confirmations': sweep.core_notifications+1
        });
    }

    console.log(deposits)

    try {
        // Make the API call to post the transactions
        const response = await axios.post(`${config.knakenURL}${endpoint}`, { deposits,  walletAPIKey: config.keys.admin, }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Knaken-Wallet-Processor': config.keys.core
            }
        });


        if (response.status === 200) {
            console.log("Transactions posted successfully", response.data);
            await databaseService.updateMultipleSweepNotificationCounts(sweepsToNotify.map(sweep => sweep.id));
        } else {
            console.error("Failed to post transactions:", response.data);
        }

    } catch (error) {
        console.error('Error posting transactions:', error);
    }
};

export default postSweepTransactions;