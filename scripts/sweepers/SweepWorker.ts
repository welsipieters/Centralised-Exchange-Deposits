import { parentPort } from 'worker_threads';
import { ethers } from 'ethers';
import blockchainConfig from "../../shared/blockchainConfig";
import {getRepository} from "typeorm";
import {Sweep} from "../../shared/models/Sweep";
import {BalanceInfo} from "./AddressMonitor";

parentPort.on('message', async (block: bigint, balanceInfo: BalanceInfo) => {
    try {
        let sweepRepository;

        if (balanceInfo.hasEth || balanceInfo.tokens.length > 0) {
            sweepRepository = getRepository(Sweep);
        }

        // Loop over each token in balanceInfo.tokens and perform sweep action
        for (const tokenBalance of balanceInfo.tokens) {
            const depositContract = new ethers.Contract(tokenBalance.address, blockchainConfig.depositAbi, blockchainConfig.signer);

            // Call sweepToken on the deposit contract for each token with a new balance
            const sweepTx = await depositContract.sweepERC20Token(tokenBalance.contractAddress);
            await sweepTx.wait(); // Wait for the transaction to be mined
            console.log(`Swept ${tokenBalance.amount} from ${tokenBalance.contractAddress}`);

            const sweep = new Sweep();
            sweep.address = balanceInfo.address;
            sweep.tokenContractAddress = tokenBalance.contractAddress;
            sweep.amount = tokenBalance.amount;
            sweep.transactionHash = sweepTx.hash;
            await sweepRepository.save(sweep);
        }

        // If balanceInfo.hasEth is true, perform sweep action for Ether
        if (balanceInfo.hasEth) {
            const depositContract = new ethers.Contract(balanceInfo.address, blockchainConfig.depositAbi, blockchainConfig.signer);

            // Call sweep function on the deposit contract for Ether
            const sweepTx = await depositContract.sweep();
            await sweepTx.wait(); // Wait for the transaction to be mined
            console.log(`Swept ${balanceInfo.ethAmount} Ether to ${balanceInfo.address}`);

            const sweep = new Sweep();
            sweep.address = balanceInfo.address;
            sweep.amount = balanceInfo.ethAmount.toString();
            sweep.tokenContractAddress = '0x0000000';
            sweep.transactionHash = sweepTx.hash;
            await sweepRepository.save(sweep);
        }

        // Send a message back to the main thread
        parentPort.postMessage(`Sweep completed for ${balanceInfo.address}`);
    } catch (error) {
        console.error('Error performing sweep action:', error);
        parentPort.postMessage(`Error performing sweep for ${balanceInfo.address}: ${error.message}`);
    }
});
