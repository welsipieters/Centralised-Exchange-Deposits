import 'reflect-metadata';
import { parentPort } from 'worker_threads';
import {ethers, toBigInt} from 'ethers';
import blockchainConfig from "../../shared/blockchainConfig";
import {getRepository} from "typeorm";
import {Sweep} from "../../shared/models/Sweep";
import {BalanceInfo} from "./AddressMonitor";
import {initializeDatabase} from "../../shared/database";
import {IDatabaseService} from "../../api/interfaces";
import types from "../../api/types";
import {container} from "../../api/inversify.config";

const MIN_CONFIRMATIONS = process.env.MIN_CONFIRMATIONS || 25;

if (!parentPort) {
    throw new Error('Parent port is missing');
}

interface WorkerMessage {
    currentBlockNumber: number;
    balanceInfo: BalanceInfo;
}

parentPort.on('message', async (message: WorkerMessage) => {
    if (!parentPort) {
        throw new Error('Parent port is missing');
    }

    const {currentBlockNumber, balanceInfo} = message;
    await initializeDatabase();
    const databaseService = container.get<IDatabaseService>(types.Database);

    console.log('Sweep worker started')
    console.log('block', currentBlockNumber)
    console.log('balanceInfo', balanceInfo)
    // console.log(`Sweeping ${balanceInfo.address} at block ${block}`);
    try {
        let sweepRepository;

        if (balanceInfo.ethDeposits.length > 0 || balanceInfo.tokens.length > 0) {
            sweepRepository = getRepository(Sweep);
        }

        // Loop over each token in balanceInfo.tokens and perform sweep action
        for (const tokenBalance of balanceInfo.tokens) {
            console.log(`Sweeping ${tokenBalance.amount} from ${tokenBalance.currencyAddress}`)
            const depositContract = new ethers.Contract(balanceInfo.address, blockchainConfig.depositAbi, blockchainConfig.signer);


            const tokenContract = new ethers.Contract(tokenBalance.currencyAddress, blockchainConfig.erc20Abi, blockchainConfig.signer);
            const tokenSymbol = await tokenContract.symbol();
            const tokenDecimals = await tokenContract.decimals();

            // Call sweepToken on the deposit contract for each token with a new balance
            const sweepTx = await depositContract.sweepERC20Token(tokenBalance.currencyAddress, `${tokenBalance.amount_real}`);
            await databaseService.updateProcessedStatusByHash(tokenBalance.hash, sweepTx.hash, true);

            try {

                console.log(`Swept ${tokenBalance.amount} from ${tokenBalance.currencyAddress}`);

                const sweep = new Sweep();
                sweep.address = balanceInfo.address;
                sweep.tokenContractAddress =  tokenBalance.currencyAddress;
                sweep.amount = tokenBalance.amount
                sweep.transactionHash = tokenBalance.hash;
                sweep.sweepHash = sweepTx.hash;
                sweep.token_name = tokenSymbol;
                sweep.block = BigInt(currentBlockNumber);
                console.log('New sweep:', sweep)
                await sweepRepository.save(sweep);
            } catch (e) {
                await databaseService.updateProcessedStatusByHash(tokenBalance.hash, sweepTx.hash, false);
            }
        }

        // If balanceInfo.hasEth is true, perform sweep action for Ether
        if (balanceInfo.ethDeposits.length > 0) {
            const hasUnprocessed = await databaseService.checkUnprocessedSweepByAddress(balanceInfo.address);
            if (hasUnprocessed) {
                console.log('Unprocessed sweep exists for address', balanceInfo.address);
                return;
            }

            console.log(`Sweeping ${balanceInfo.ethDeposits.length} ETH transactions from ${balanceInfo.address}`)

            const depositContract = new ethers.Contract(balanceInfo.address, blockchainConfig.depositAbi, blockchainConfig.signer);
            const sweepTx = await depositContract.sweepEther();
            for (const ethDeposit of balanceInfo.ethDeposits) {


                await databaseService.updateProcessedStatusByHash(ethDeposit.hash, sweepTx.hash, true);
                console.log('sweepTx', sweepTx.hash)

                let token = 'ETH'
                switch (process.env.BLOCKCHAIN_NETWORK) {
                    case 'polygon':
                        token = 'MATIC'
                        break;

                    default:
                        token = 'ETH'
                        break;
                }

                try {

                    const sweep = new Sweep();
                    sweep.address = balanceInfo.address;
                    sweep.amount = ethDeposit.amount;
                    sweep.tokenContractAddress = '0x0000000';
                    sweep.token_name = token;
                    sweep.transactionHash = sweepTx.hash;
                    sweep.block = BigInt(currentBlockNumber);
                    sweep.sweepHash = sweepTx.hash;

                    console.log('New sweep:', sweep);
                    await sweepRepository.save(sweep);

                    // const receipt = await sweepTx.wait();
                    // console.log('receipt', receipt)
                }
                catch (e) {
                    await databaseService.updateProcessedStatusByHash(ethDeposit.hash, null, false);
                }
            }
        }

        // Send a message back to the main thread
        parentPort.postMessage(`Sweep completed for ${balanceInfo.address}`);
    } catch (error) {

        console.error('Error performing sweep action:', error);
        parentPort.postMessage(`Error performing sweep for ${balanceInfo.address}: ${error}`);
    }
});
