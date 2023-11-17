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
    private confirmedTransactions: Set<string>;
    private monitoredAddresses: Set<string>;

    constructor() {
        console.log('DepositListener is being initialized...');

        this.databaseService = container.get<IDatabaseService>(types.Database);
        this.provider = blockchainConfig.provider;
        this.confirmedTransactions = new Set();
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

    private async listenForDeposits(): Promise<void> {
        this.provider.on("block", async (blockNumber) => {
            console.log(`Received new block: ${blockNumber}`);
            try {
                await this.checkForConfirmedTransactions(blockNumber - CONFIRMATION_THRESHOLD);
                const block = await this.provider.getBlock(blockNumber);
                if (!block) return;

                const transactions = await Promise.all(block.transactions.map(txHash => this.provider.getTransaction(txHash)));
                console.log(`Processing ${transactions.length} transactions from block ${blockNumber}`);

                for (const transaction of transactions) {
                    if (transaction && transaction.to && this.monitoredAddresses.has(transaction.to.toLowerCase()) && transaction.value > ethers.parseEther('0')) {
                        console.log(`Relevant transaction detected: ${transaction.hash}`);
                        this.confirmedTransactions.add(transaction.hash);

                        const tokenDeposit = new Deposit();
                        tokenDeposit.hash = transaction.hash;
                        tokenDeposit.blockNumber = blockNumber;
                        tokenDeposit.fromAddress = transaction.from;
                        tokenDeposit.toAddress = transaction.to;
                        tokenDeposit.currencyAddress = '0x0';
                        tokenDeposit.currencyName = 'ETH';
                        tokenDeposit.amount = ethers.formatEther(transaction.value);
                        tokenDeposit.amount_real = transaction.value;


                        await this.databaseService.insertDeposit(tokenDeposit);
                    }
                }
            } catch (error) {
                console.error(`Error processing block ${blockNumber}:`, error);
            }
        });
    }


    private async checkForConfirmedTransactions(blockNumber: number): Promise<void> {
        const confirmationBlockNumber = blockNumber - CONFIRMATION_THRESHOLD;
        if (isNaN(confirmationBlockNumber)) {
            console.error('Invalid confirmation block number');
            return;
        }

        console.log(`Checking for confirmed transactions up to block ${confirmationBlockNumber}`);
        for (const hash of this.confirmedTransactions) {
            const receipt = await this.provider.getTransactionReceipt(hash);
            if (receipt && receipt.blockNumber <= confirmationBlockNumber) {
                console.log(`Confirmed transaction: ${hash}`);
                this.confirmedTransactions.delete(hash);
                // Process the confirmed transaction here
            }
        }
    }
}


(async () => {
    await initializeDatabase();

    const listener = new DepositListener();
    await listener.initialize();

})().catch(console.error);