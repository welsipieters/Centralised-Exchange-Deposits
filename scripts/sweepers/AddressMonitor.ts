import { ethers } from 'ethers';

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
    private addresses: string[];
    private lastCheckedBlock: number;
    private provider: ethers.JsonRpcProvider;

    constructor(addresses: string[], provider: ethers.JsonRpcProvider) {
        this.addresses = addresses;
        this.provider = provider;
        this.lastCheckedBlock = 0; // You might want to persist and load this value
    }

    public async start() {
        try {
            // Update the last checked block to the current block number
            const currentBlockNumber = await this.provider.getBlockNumber();

            // Check ETH and ERC-20 token balances
            const balanceInfo = await this.checkBalances(currentBlockNumber);

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

        const paddedAddresses = this.addresses.map(address => ethers.utils.hexZeroPad(address, 32));
        const topics = [
            ethers.id("Transfer(address,address,uint256)"),
            null,
            paddedAddresses
        ];

        const logs = await this.provider.getLogs({
            fromBlock: this.lastCheckedBlock + 1,
            toBlock: currentBlockNumber,
            topics: [topics]
        });

        for (const address of this.addresses) {
            let hasNewEthBalance = false;
            let newEthAmount: bigint = BigInt(0);
            let receivedTokens: TokenBalance[] = [];

            // Check ETH balance for the address
            const ethBalance = await this.provider.getBalance(address, this.lastCheckedBlock + 1);
            if (ethBalance !== BigInt(0)) {
                hasNewEthBalance = true;
                newEthAmount = ethBalance;
            }

            // Filter and process logs for this address
            const addressLogs = logs.filter(log => log.topics[2].toLowerCase() === address.toLowerCase());
            for (const log of addressLogs) {
                const tokenContractAddress = log.address;
                const logInterface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
                const decodedLog = logInterface.parseLog(log);
                const amount = decodedLog.args.value;
                receivedTokens.push({ contractAddress: tokenContractAddress, amount });
            }

            // Construct and push BalanceInfo for this address
            allBalanceInfo.push({
                address,
                hasEth: hasNewEthBalance,
                ethAmount: newEthAmount,
                tokens: receivedTokens,
            });
        }

        return allBalanceInfo;
    }



    private sweep(currentBlockNumber: number, balanceInfo: BalanceInfo) {
        const worker = new Worker('./SweepWorker.ts');

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