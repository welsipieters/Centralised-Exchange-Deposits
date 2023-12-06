import { ethers } from "ethers";
import {DatabaseService} from "../../shared/services/DatabaseService";
import blockchainConfig from "../../shared/blockchainConfig";
import {Deposit} from "../../shared/models/Deposit";
import {IBlockchainService, IDatabaseService} from "../../api/interfaces";
import types from "../../api/types";
import {container} from "../../api/inversify.config";
import {task} from "hardhat/config";
import hardhatConfig from "../../hardhat.config";

class EthereumTransactionProcessor {
    private provider: ethers.Provider;
    private databaseService;

    constructor() {
         console.log('config', hardhatConfig)
        this.provider = blockchainConfig.provider;
        this.databaseService = container.get<IDatabaseService>(types.Database);

    }

    async processTransaction(transactionHash: string): Promise<void> {
        const receipt = await this.provider.getTransactionReceipt(transactionHash);
        if (!receipt) {
            console.error('Transaction receipt not found');
            return;
        }

        for (const log of receipt.logs) {
            const decodedLog = this.decodeLog(log); // Implement this method based on your log structure
            if (!decodedLog) {
                continue;
            }


            const existingDeposit = await this.databaseService.findDepositByHash(log.transactionHash);
            if (!existingDeposit) {
                const amount = decodedLog.args.value; // Make sure this matches your log's structure

                const tokenDeposit = new Deposit();
                tokenDeposit.hash = log.transactionHash;
                tokenDeposit.blockNumber = decodedLog.blockNumber;
                tokenDeposit.fromAddress = decodedLog.fromAddress;
                tokenDeposit.toAddress = decodedLog.toAddress
                tokenDeposit.currencyAddress = decodedLog.address;
                tokenDeposit.currencyName = decodedLog.tokenName
                tokenDeposit.amount = ethers.formatUnits(decodedLog.amount, decodedLog.tokenDecimals);
                tokenDeposit.amount_real = decodedLog.amount;

                await this.databaseService.insertDeposit(tokenDeposit);
            }
        }
    }

    private async decodeLog(log: ethers.Log): any {
        const logInterface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
        const decodedLog = logInterface.parseLog(log);
        const amount = decodedLog.args.value;

        const tokenContract = new ethers.Contract(log.address, blockchainConfig.erc20Abi, this.provider);
        const tokenName = await tokenContract.symbol();
        const tokenDecimals = await tokenContract.decimals();

        return {
            tokenName,
            tokenDecimals,
            amount,
            address: log.address,
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
            fromAddress: decodedLog.args.from,
            toAddress: decodedLog.args.to,
        }
    }

}

task("processTx", "Processes an Ethereum transaction")
    .addParam("tx", "The Ethereum transaction hash to process")
    .setAction(async (taskArgs, hre) => {
        console.log('Processing transaction', taskArgs.tx);
        const processor = new EthereumTransactionProcessor();
        await processor.processTransaction(taskArgs.tx);
        console.log('Transaction processed successfully');
    });
