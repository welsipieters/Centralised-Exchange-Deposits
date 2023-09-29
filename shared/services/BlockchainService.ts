import { ethers } from 'ethers';
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

        // Process receipt asynchronously
        tx.wait().then(receipt => this.processReceipt(receipt, count))
            .then(deployedAddresses => deployedAddresses.map(address => this.databaseService.saveAddress(address)))
            .then(saveAddressPromises => Promise.all(saveAddressPromises))
            .catch(error => console.error('Error processing receipt', error));

        // Return transaction hash immediately
        return tx.hash;
    }

    private async processReceipt(receipt: ethers.TransactionReceipt, count: number): Promise<string[]> {
        const deployedAddresses: string[] = [];

        if (receipt.logs) {
            for (const log of receipt.logs) {
                // @ts-ignore
                if (log.fragment.name === 'ContractDeployed') {
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
}
