import { ethers } from 'ethers';
import hardhatConfig from "../hardhat.config";
import factoryAbi from "../abi/factory.json";
import depositAbi from "../abi/deposit.json";
import erc20Abi from "../abi/erc20.json";
export class BlockchainConfig {
    public readonly network: string;
    public readonly provider: ethers.JsonRpcProvider;
    public readonly signer: ethers.Wallet;
    public readonly contractAddress: string;
    public readonly factoryAbi: any;
    public readonly depositAbi: any;
    public readonly erc20Abi: any;

    constructor() {
        this.network = process.env.BLOCKCHAIN_NETWORK || 'hardhat';
        const hardhatNetworkConfig = hardhatConfig.networks?.[this.network]

        if (!hardhatNetworkConfig) {
            throw new Error(`Network configuration not found for ${this.network}`);
        }

        // @ts-ignore
        if (!hardhatNetworkConfig.url) {
            throw new Error('Provider URL is missing.');
        }

        // @ts-ignore
        this.provider = new ethers.JsonRpcProvider(hardhatNetworkConfig.url);

        if (!hardhatNetworkConfig.accounts || !hardhatNetworkConfig.accounts[0]) {
            throw new Error('Account is missing from network configuration');
        }

        this.signer = new ethers.Wallet(hardhatNetworkConfig.accounts[0], this.provider);

        this.contractAddress = process.env.CONTRACT_ADDRESS || '';
        if (!ethers.isAddress(this.contractAddress)) {
            throw new Error(`Invalid contract address: ${this.contractAddress}`);
        }

        this.factoryAbi = factoryAbi
        this.depositAbi = depositAbi
        this.erc20Abi = erc20Abi
    }
}

// Export a single instance of the config class
const blockchainConfig = new BlockchainConfig();
export default blockchainConfig;