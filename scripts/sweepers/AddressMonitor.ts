import { ethers } from 'ethers';
import blockchainConfig from "../../shared/blockchainConfig";
import {DepositAddress} from "../../shared/models/DepositAddress";
import {container} from "../../api/inversify.config";
import {IDatabaseService} from "../../api/interfaces";
import types from "../../api/types";
import {Worker} from 'worker_threads';
export interface TokenBalance {
    contractAddress: string;
    amount: bigint;
}

export interface BalanceInfo {
    address: string;
    hasEth: boolean;
    ethAmount: bigint;
    tokens: TokenBalance[];
}

export class AddressMonitor {
    private addresses: DepositAddress[];
    private lastCheckedBlock: number;
    private provider: ethers.JsonRpcProvider;
    private databaseService = container.get<IDatabaseService>(types.Database);

    constructor(addresses: DepositAddress[]) {
        this.addresses = addresses;
        this.provider = blockchainConfig.provider;
        this.lastCheckedBlock = 0; // You might want to persist and load this value
    }

    public async start() {
        console.log('Starting worker for addresses:', this.addresses.map(address => address.deposit_address));
        try {
            // Update the last checked block to the current block number
            const currentBlockNumber = await this.provider.getBlockNumber();

            // Check ETH and ERC-20 token balances
            const balanceInfo = await this.checkBalances(currentBlockNumber);
            console.log('Balance info:', balanceInfo);
            for (const tokenBalance of balanceInfo) {

                if (tokenBalance.hasEth || tokenBalance.tokens.length > 0) {
                    console.log(`Found new balance for ${tokenBalance.address}`);

                    this.sweep(currentBlockNumber, tokenBalance);
                }
            }

            this.lastCheckedBlock = currentBlockNumber;
        } catch (error) {
            console.error('Error monitoring addresses:', this.addresses, error);
        }
    }

    private async checkBalances(currentBlockNumber: number): Promise<BalanceInfo[]> {
        let allBalanceInfo: BalanceInfo[] = [];

       const paddedAddresses = this.addresses.map(address => ethers.zeroPadValue(ethers.getAddress(address.deposit_address), 32))
        const blocks = this.addresses.map(address => address.last_seen_at_block)
        console.log({
            fromBlock: Math.min(...blocks),
            toBlock: currentBlockNumber,
            topics: [ethers.keccak256(ethers.toUtf8Bytes('Transfer(address,address,uint256)')), null, paddedAddresses]
        })
        const logs = await this.provider.getLogs({
            fromBlock: Math.min(...blocks),
            toBlock: currentBlockNumber,
            topics: [ethers.keccak256(ethers.toUtf8Bytes('Transfer(address,address,uint256)')), null, paddedAddresses]
        });
        console.log('Logs:', logs)


        for (const address of this.addresses) {
            console.log(`Checking balance for ${address.deposit_address}`);

            let hasNewEthBalance = false;
            let newEthAmount: bigint = BigInt(0);
            let receivedTokens: TokenBalance[] = [];

            // Check ETH balance for the address
            const ethBalance = await this.provider.getBalance(address.deposit_address, currentBlockNumber);
            console.log(`ETH balance for ${address.deposit_address}: ${ethBalance}`);
            if (ethBalance !== BigInt(0)) {
                hasNewEthBalance = true;
                newEthAmount = ethBalance;
            }

            // Filter and process logs for this address
            const addressLogs = logs.filter(log => log.topics[2].toLowerCase() === ethers.zeroPadValue(address.deposit_address, 32).toLowerCase());
            for (const log of addressLogs) {
                const tokenContractAddress = log.address;
                const logInterface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
                // @ts-ignore
                const decodedLog = logInterface.parseLog(log);
                // @ts-ignore
                const amount = decodedLog.args.value;
                receivedTokens.push({ contractAddress: tokenContractAddress, amount });
            }

            // Construct and push BalanceInfo for this address
            allBalanceInfo.push({
                address: address.deposit_address,
                hasEth: hasNewEthBalance,
                ethAmount: newEthAmount,
                tokens: receivedTokens,
            });
        }

        await this.databaseService.updateLastSeenAtBlockForAddresses(this.addresses, currentBlockNumber)

        return allBalanceInfo;
    }

    private sweep(currentBlockNumber: number, balanceInfo: BalanceInfo) {
        const worker = new Worker('./scripts/sweepers/SweepWorker.ts');

        // @ts-ignore
        worker.on('message', (message) => {
            console.log(message);
        });

        // @ts-ignore
        worker.on('error', (error) => {
            console.error('Error from sweep worker:', error);
        });

        worker.postMessage({currentBlockNumber, balanceInfo});
    }
}