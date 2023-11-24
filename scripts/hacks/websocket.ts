import 'reflect-metadata';
import 'dotenv/config';
import {IDatabaseService} from "../../api/interfaces";
import {ethers} from "ethers";
import {container} from "../../api/inversify.config";
import types from "../../api/types";
import blockchainConfig from "../../shared/blockchainConfig";
import {initializeDatabase} from "../../shared/database";
import {Deposit} from "../../shared/models/Deposit";

const CACHE_REFRESH_INTERVAL = 60000; // 1 minute in milliseconds
const CONFIRMATION_THRESHOLD = +process.env.MIN_CONFIRMATIONS || 12; // Default to 12 if not specified


class DepositListener {
    private databaseService: IDatabaseService;
    private provider: ethers.JsonRpcProvider;
    private confirmedTransactions: Map<string, number>;
    private monitoredAddresses: Set<string>;

    constructor() {
        console.log('DepositListener is being initialized...');

        this.databaseService = container.get<IDatabaseService>(types.Database);
        this.provider = blockchainConfig.provider;
        this.confirmedTransactions = new Map();
        this.monitoredAddresses = new Set();
    }

    public async initialize(): Promise<void> {
        console.log('Initializing DepositListener...');
        await this.refreshAddressCache();
        setInterval(() => this.refreshAddressCache(), CACHE_REFRESH_INTERVAL);
        this.listenForDeposits();
        console.log('DepositListener initialized and listening for deposits.');
    }
    private async refreshAddressCache(): Promise<void> {
        try {
            console.log('Refreshing address cache...');
            const addresses = await this.databaseService.fetchAllInUseAddresses();
            this.monitoredAddresses = new Set(addresses.map(a => a.deposit_address.toLowerCase()));
            console.log(`Address cache refreshed with ${addresses.length} addresses.`);
        } catch (error) {
            console.error('Error refreshing address cache:', error);
        }
    }

    // private async listenForDeposits(): Promise<void> {
    //     this.provider.on("block", async (blockNumber) => {
    //         console.log(`Received new block: ${blockNumber}`);
    //         try {
    //             await this.checkForConfirmedTransactions(blockNumber - CONFIRMATION_THRESHOLD);
    //             const block = await this.provider.getBlock(blockNumber);
    //             if (!block) return;
    //
    //             const transactions = await Promise.all(block.transactions.map(txHash => this.provider.getTransaction(txHash)));
    //             console.log(`Processing ${transactions.length} transactions from block ${blockNumber}`);
    //
    //             for (const transaction of transactions) {
    //                 if (transaction && transaction.to && this.monitoredAddresses.has(transaction.to.toLowerCase()) && transaction.value > ethers.parseEther('0')) {
    //                     console.log(`Relevant transaction detected: ${transaction.hash}`);
    //                     this.confirmedTransactions.add(transaction.hash);
    //
    //
    //                 }
    //             }
    //         } catch (error) {
    //             console.error(`Error processing block ${blockNumber}:`, error);
    //         }
    //     });
    // }
    //


    private async listenForDeposits(): Promise<void> {
        await this.provider.on("block", async (blockNumber) => {
            console.log(`Received new block: ${blockNumber}`);
            try {
                await this.checkForConfirmedTransactions(blockNumber - CONFIRMATION_THRESHOLD);

                const block = await this.provider.getBlock(blockNumber, true);
                if (!block) return;

                console.log(`Processing ${block.transactions.length} transactions from block ${blockNumber}`);

                for (const transaction of block.prefetchedTransactions) {
                    if (transaction && transaction.to && this.monitoredAddresses.has(transaction.to.toLowerCase()) && transaction.value > ethers.parseEther('0')) {
                        console.log(`Relevant transaction detected: ${transaction.hash}`);

                        this.confirmedTransactions.set(transaction.hash, blockNumber);
                    }
                }
            } catch (error) {
                console.error(`Error processing block ${blockNumber}:`, error);
            }
        });
    }

    private async checkForConfirmedTransactions(currentBlockNumber: number): Promise<void> {
        for (const [hash, transactionBlockNumber] of this.confirmedTransactions) {
            if (currentBlockNumber - transactionBlockNumber >= CONFIRMATION_THRESHOLD) {
                const receipt = await this.provider.getTransaction(hash);
                if (receipt && receipt.blockNumber && receipt.blockNumber <= transactionBlockNumber + CONFIRMATION_THRESHOLD) {
                    console.log(`Confirmed transaction: ${hash}`);
                    this.confirmedTransactions.delete(hash);

                    let token = 'ETH'
                    switch (process.env.BLOCKCHAIN_NETWORK) {
                        case 'polygon':
                            token = 'MATIC'
                            break;

                        default:
                            token = 'ETH'
                            break;
                    }


                    const tokenDeposit = new Deposit();
                    tokenDeposit.hash = receipt.hash;
                    tokenDeposit.blockNumber = currentBlockNumber;
                    tokenDeposit.fromAddress = receipt.from;
                    tokenDeposit.toAddress = receipt.to ?? '';
                    tokenDeposit.currencyAddress = '0x0';
                    tokenDeposit.currencyName = token;
                    tokenDeposit.amount = ethers.formatEther(receipt.value);
                    tokenDeposit.amount_real = receipt.value;

                    await this.databaseService.insertDeposit(tokenDeposit);
                }
            }
        }
    }

}


(async () => {
    await initializeDatabase();

    const listener = new DepositListener();
    await listener.initialize();

})().catch(console.error);