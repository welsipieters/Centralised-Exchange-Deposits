import { ethers } from 'ethers';
import blockchainConfig from "../../shared/blockchainConfig";
import {DepositAddress} from "../../shared/models/DepositAddress";
import {container} from "../../api/inversify.config";
import {IDatabaseService} from "../../api/interfaces";
import types from "../../api/types";
import {Worker} from 'worker_threads';
import {Deposit} from "../../shared/models/Deposit";
import AllowedTokens from "../../allowedTokens"
export interface TokenBalance {
    contractAddress: string;
    amount: bigint;
}

export interface BalanceInfo {
    address: string;
    hasEth: boolean;
    ethAmount: bigint;
    tokens: Deposit[];
    ethDeposits: Deposit[];
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

                if (tokenBalance.ethDeposits.length > 0 || tokenBalance.tokens.length > 0) {
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

        const logs = await this.provider.getLogs({
            fromBlock: Math.min(...blocks),
            toBlock: currentBlockNumber,
            topics: [ethers.keccak256(ethers.toUtf8Bytes('Transfer(address,address,uint256)')), null, paddedAddresses]
        });
        console.log('Logs:', logs)


        for (const address of this.addresses) {
            console.log(`Checking balance for ${address.deposit_address}`);
            // const ethTransactions = await this.getEthTransactions(address.deposit_address, Math.min(...blocks), currentBlockNumber);

            let hasNewEthBalance = false;
            let newEthAmount: bigint = BigInt(0);
            let receivedTokens: TokenBalance[] = [];
            let tokenDeposits: Deposit[] = [];
            // Check ETH balance for the address
            const ethBalance = await this.provider.getBalance(address.deposit_address, currentBlockNumber);
            console.log(`ETH balance for ${address.deposit_address}: ${ethBalance}`);


            // Filter and process logs for this address
            const addressLogs = logs.filter(log => log.topics[2].toLowerCase() === ethers.zeroPadValue(address.deposit_address, 32).toLowerCase());
            for (const log of addressLogs) {
                console.log('Log:', log)
                const tokenContractAddress = log.address;

                if (!AllowedTokens.some((token) => token.toLowerCase() === tokenContractAddress.toLowerCase())) {
                    continue;
                }

                const logInterface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
                const decodedLog = logInterface.parseLog(log);
                const amount = decodedLog.args.value;
                receivedTokens.push({ contractAddress: tokenContractAddress, amount });

                const tokenContract = new ethers.Contract(tokenContractAddress, blockchainConfig.erc20Abi, this.provider);
                const tokenName = await tokenContract.symbol();
                const tokenDecimals = await tokenContract.decimals();

                const existingDeposit = await this.databaseService.findDepositByHash(log.transactionHash);
                if (!existingDeposit) {
                    const tokenDeposit = new Deposit();
                    tokenDeposit.hash = log.transactionHash;
                    tokenDeposit.blockNumber = log.blockNumber;
                    tokenDeposit.fromAddress = decodedLog.args.from;
                    tokenDeposit.toAddress = decodedLog.args.to;
                    tokenDeposit.currencyAddress = tokenContractAddress;
                    tokenDeposit.currencyName = tokenName;
                    tokenDeposit.amount = ethers.formatUnits(amount, tokenDecimals);
                    tokenDeposit.amount_real = amount;

                    await this.databaseService.insertDeposit(tokenDeposit);
                }
            }

            // for (const transaction of ethTransactions) {
            //     console.log('ETH Transaction:', transaction)
            //     if (transaction.to.toLowerCase() === address.deposit_address.toLowerCase()) {
            //         const existingEthDeposit = await this.databaseService.findDepositByHash(transaction.hash);
            //         if (!existingEthDeposit) {
            //             // Create a deposit record for each ETH transaction
            //             const ethDeposit = new Deposit();
            //             ethDeposit.hash = transaction.hash;
            //             ethDeposit.blockNumber = transaction.blockNumber;
            //             ethDeposit.fromAddress = transaction.from;
            //             ethDeposit.toAddress = transaction.to;
            //             ethDeposit.currencyName = 'ETH';
            //             ethDeposit.currencyAddress = '0x0';
            //             ethDeposit.amount = ethers.formatEther(transaction.value);
            //             ethDeposit.amount_real = transaction.value;
            //             await this.databaseService.insertDeposit(ethDeposit);
            //         }
            //     }
            // }
            console.log(ethBalance, 'ethBalance', address.last_seen_balance)
            // if (ethBalance > ethers.parseEther(address.last_seen_balance)) {
            //     console.log('New ETH balance found')
            //
            //     hasNewEthBalance = true;
            //     newEthAmount = ethBalance;
            //
            //     const ethDeposit = new Deposit();
            //     ethDeposit.hash = '0x' + (new Date().getTime()).toString(16);
            //     ethDeposit.blockNumber = currentBlockNumber;
            //     ethDeposit.fromAddress = '0x0';
            //     ethDeposit.toAddress = address.deposit_address;
            //     ethDeposit.currencyName = 'ETH';
            //     ethDeposit.currencyAddress = '0x0';
            //     ethDeposit.amount = ethers.formatEther(ethBalance);
            //     ethDeposit.amount_real = ethBalance;
            //     await this.databaseService.insertDeposit(ethDeposit);
            //
            //     console.log('Updating last seen balance for address:', address.deposit_address)
            //     const balanceUpdate = await this.databaseService.updateLastSeenBalance(address.deposit_address, ethBalance.toString());
            //     console.log('Balance update:', balanceUpdate)
            // }


            await this.databaseService.updateLastSeenAtBlockForAddresses(this.addresses, currentBlockNumber)
            // Construct and push BalanceInfo for this address
            allBalanceInfo.push({
                address: address.deposit_address,
                hasEth: hasNewEthBalance,
                ethAmount: newEthAmount,
                ethDeposits: await this.databaseService.findUnprocessedEthDepositsByToAddress(address.deposit_address),
                tokens: await this.databaseService.findUnprocessedTokenDepositsByToAddress(address.deposit_address),
            });
        }

        console.log('All balance info:', allBalanceInfo)
        // process.exit(0)
        return allBalanceInfo;
    }

    // async getEthTransactions(address, fromBlock, toBlock) {
    //     const provider = blockchainConfig.provider;
    //     let transactions = [];
    //
    //     for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    //         let block = await provider.getBlock(blockNumber, true);
    //         for (let tx of block?.prefetchedTransactions) {
    //
    //            if (tx.to) {
    //                console.log('Tx:', tx.to, address.toLowerCase(), tx.to.toLowerCase() === address.toLowerCase())
    //            }
    //             if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
    //                 console.log('Found transaction:', tx)
    //                 transactions.push(tx);
    //             }
    //         }
    //     }
    //
    //     console.log('Transactions:', transactions)
    //
    //     return transactions;
    // }

    async getEthTransactions(address, fromBlock, toBlock) {
        const provider = blockchainConfig.provider;
        let transactions = [];

        // Create a range of block numbers
        const blockNumbers = Array.from({ length: toBlock - fromBlock + 1 }, (_, i) => i + fromBlock);

        // Process blocks in parallel (be mindful of rate limits)
        const blockPromises = blockNumbers.map(blockNumber => provider.getBlock(blockNumber, true));
        const blocks = await Promise.all(blockPromises);

        for (const block of blocks) {
            if (block && block.prefetchedTransactions) {
                console.log('Block:', block)
                const filteredTransactions = block.transactions.filter(tx => tx.to && tx.to.toLowerCase() === address.toLowerCase());
                transactions.push(...filteredTransactions);
            }
        }

        console.log('Transactions:', transactions);
        return transactions;
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