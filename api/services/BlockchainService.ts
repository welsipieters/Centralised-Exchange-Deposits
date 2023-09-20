import { ethers } from 'ethers';
import {IBlockchainService} from "../interfaces";
import {injectable} from "inversify";

@injectable()
export class BlockchainService implements IBlockchainService {
    private provider: ethers.providers.JsonRpcProvider;
    private contract: ethers.Contract;

    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider('YOUR_ETHEREUM_NODE_URL');
        this.contract = new ethers.Contract(YOUR_CONTRACT_ADDRESS, YOUR_CONTRACT_ABI, this.provider);
    }

    async generateAddresses(count: number): Promise<string[]> {
        // Call the contract's method to generate addresses
        return await this.contract.deployMultipleContracts(count);
    }
}
