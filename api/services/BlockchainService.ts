import { ethers } from 'ethers';
import {IBlockchainService} from "../interfaces";
import {injectable} from "inversify";
import blockchainConfig from "../blockchainConfig";

@injectable()
export class BlockchainService implements IBlockchainService {
    private readonly provider: ethers.JsonRpcProvider;
    private contract: ethers.Contract;

    constructor() {
        this.provider = blockchainConfig.provider;
        this.contract = new ethers.Contract(blockchainConfig.contractAddress, blockchainConfig.contractAbi, this.provider);
    }

    async generateAddresses(count: number): Promise<string[]> {
        // Call the contract's method to generate addresses
        return await this.contract.deployMultipleContracts(count);
    }
}
