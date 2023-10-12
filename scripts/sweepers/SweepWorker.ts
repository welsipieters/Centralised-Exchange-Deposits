import { parentPort } from 'worker_threads';
import { ethers } from 'ethers';
import blockchainConfig from "../../shared/blockchainConfig";
import {getRepository} from "typeorm";
import {Sweep} from "../../shared/models/Sweep";
import {BalanceInfo} from "./AddressMonitor";
import {initializeDatabase} from "../../shared/database";

const MIN_CONFIRMATIONS = process.env.MIN_CONFIRMATIONS || 25;

if (!parentPort) {
    throw new Error('Parent port is missing');
}

parentPort.on('message', async ({currentBlockNumber, balanceInfo}) => {
    if (!parentPort) {
        throw new Error('Parent port is missing');
    }
    await initializeDatabase();
    console.log('Sweep worker started')
    console.log('block', currentBlockNumber)
    console.log('balanceInfo', balanceInfo)
    // console.log(`Sweeping ${balanceInfo.address} at block ${block}`);
    try {
        let sweepRepository;

        if (balanceInfo.hasEth || balanceInfo.tokens.length > 0) {
            sweepRepository = getRepository(Sweep);
        }

        // Loop over each token in balanceInfo.tokens and perform sweep action
        for (const tokenBalance of balanceInfo.tokens) {
            console.log(`Sweeping ${tokenBalance.amount} from ${tokenBalance.contractAddress}`)
            const depositContract = new ethers.Contract(balanceInfo.address, blockchainConfig.depositAbi, blockchainConfig.signer);


            const tokenContract = new ethers.Contract(tokenBalance.contractAddress, blockchainConfig.erc20Abi, blockchainConfig.signer);
            const tokenSymbol = await tokenContract.symbol();
            const tokenDecimals = await tokenContract.decimals();

            const adjustedTokenBalance = ethers.formatUnits(tokenBalance.amount, tokenDecimals);


            // Call sweepToken on the deposit contract for each token with a new balance
            const sweepTx = await depositContract.sweepERC20Token(tokenBalance.contractAddress, tokenBalance.amount);
            await sweepTx.wait(MIN_CONFIRMATIONS); // Wait for the transaction to be mined
            console.log(`Swept ${tokenBalance.amount} from ${tokenBalance.contractAddress}`);

            const sweep = new Sweep();
            sweep.address = balanceInfo.address;
            sweep.tokenContractAddress = tokenBalance.contractAddress;
            sweep.amount = adjustedTokenBalance
            sweep.transactionHash = sweepTx.hash;
            sweep.token_name = tokenSymbol;
            sweep.block = currentBlockNumber;
            await sweepRepository.save(sweep);
        }

        // If balanceInfo.hasEth is true, perform sweep action for Ether
        if (balanceInfo.hasEth) {
            console.log(`Sweeping ${balanceInfo.ethAmount} Ether from ${balanceInfo.address}`)
            const depositContract = new ethers.Contract(balanceInfo.address, blockchainConfig.depositAbi, blockchainConfig.signer);

            // Call sweep function on the deposit contract for Ether
            const sweepTx = await depositContract.sweepEther();
            console.log('sweepTx', sweepTx.hash)
            await sweepTx.wait(MIN_CONFIRMATIONS); // Wait for the transaction to be mined
            console.log(`Swept ${balanceInfo.ethAmount} Ether from ${balanceInfo.address}`);

            const sweep = new Sweep();
            sweep.address = balanceInfo.address;
            sweep.amount = ethers.parseEther(balanceInfo.ethAmount.toString()).toString()
            sweep.tokenContractAddress = '0x0000000';
            sweep.token_name = 'ETH';
            sweep.transactionHash = sweepTx.hash;
            sweep.block = currentBlockNumber;
            await sweepRepository.save(sweep);
        }

        // Send a message back to the main thread
        parentPort.postMessage(`Sweep completed for ${balanceInfo.address}`);
    } catch (error) {
        console.error('Error performing sweep action:', error);
        parentPort.postMessage(`Error performing sweep for ${balanceInfo.address}: ${error}`);
    }
});
