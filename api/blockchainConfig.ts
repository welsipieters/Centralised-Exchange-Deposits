import { ethers } from 'ethers';

export class BlockchainConfig {
    public readonly network: string;
    public readonly provider: ethers.JsonRpcProvider;
    public readonly contractAddress: string;
    public readonly contractAbi: any;

    constructor() {
        this.network = process.env.BLOCKCHAIN_NETWORK || 'hardhat';
        const providerUrl = this.network === 'hardhat' ?
            'http://localhost:8545' :
            process.env.BLOCKCHAIN_PROVIDER_URL;

        if (!providerUrl) throw new Error('Provider URL is missing from environment variables');

        this.provider = new ethers.JsonRpcProvider(providerUrl);


        this.contractAddress = process.env.CONTRACT_ADDRESS || '';
        if (!ethers.isAddress(this.contractAddress)) {
            throw new Error(`Invalid contract address: ${this.contractAddress}`);
        }

        const contractAbiStr = process.env.CONTRACT_ABI || '';
        try {
            this.contractAbi = JSON.parse(contractAbiStr);
        } catch (error) {
            throw new Error('Error parsing contract ABI from environment variables');
        }
    }
}

// Export a single instance of the config class
const blockchainConfig = new BlockchainConfig();
export default blockchainConfig;