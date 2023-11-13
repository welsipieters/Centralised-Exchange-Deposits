import {ethers} from 'ethers';
import {IBlockchainService, IDatabaseService} from "../../api/interfaces";
import {injectable} from "inversify";
import blockchainConfig from "../blockchainConfig";
import types from "../../api/types";
import {container} from "../../api/inversify.config";

@injectable()
export class BlockchainService implements IBlockchainService {
    private contract: ethers.Contract;
    private databaseService = container.get<IDatabaseService>(types.Database);

    constructor() {
        this.contract = new ethers.Contract(blockchainConfig.contractAddress, blockchainConfig.factoryAbi, blockchainConfig.signer);
    }
    async generateAddresses(count: number): Promise<string> {
        const tx = await this.contract.deployMultipleContracts(count);
        const currentBlockNumber = await blockchainConfig.provider.getBlockNumber();

        tx.wait().then(receipt => this.processReceipt(receipt, count))
            .then(deployedAddresses => deployedAddresses.map(address => this.databaseService.saveAddress(address, currentBlockNumber)))
            .then(saveAddressPromises => Promise.all(saveAddressPromises))
            .catch(error => console.error('Error processing receipt', error));

        // Return transaction hash immediately
        return tx.hash;
    }

    private async processReceipt(receipt: ethers.TransactionReceipt, count: number): Promise<string[]> {
        const deployedAddresses: string[] = [];

        if (receipt.logs) {
            for (const log of receipt.logs) {
                console.log('Log:', log)
                // @ts-ignore
                if (log.fragment && log.fragment.name === 'ContractDeployed') {
                    // @ts-ignore
                    const address = log.args && log.args[0];
                    if (address) deployedAddresses.push(address);
                }
            }
        }

        if (deployedAddresses.length !== count) {
            throw new Error('Mismatch in number of deployed addresses and expected count');
        }

        return deployedAddresses;
    }

    async getTransactionConfirmations(txHash: string): Promise<number> {
        try {
            // Get the transaction receipt
            const receipt = await blockchainConfig.provider.getTransactionReceipt(txHash);

            // Check if the transaction has been mined
            if (receipt && receipt.blockNumber) {
                // Get the current block number
                const currentBlockNumber = await blockchainConfig.provider.getBlockNumber();

                // Calculate the number of confirmations
                return currentBlockNumber - receipt.blockNumber;
            } else {
                // Transaction is not mined yet
                return 0;
            }
        } catch (error) {
            console.error('Error fetching transaction receipt:', error);
            return -1; // Indicate that an error occurred
        }
    }
}
