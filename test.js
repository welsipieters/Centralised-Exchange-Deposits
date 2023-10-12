const { ethers } = require('ethers');
const blockchainConfig = require("./shared/blockchainConfig");

const ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "version",
                "type": "uint8"
            }
        ],
        "name": "Initialized",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "coldStorage",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_factory",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "sweepERC20Token",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "nftAddress",
                "type": "address"
            },
            {
                "internalType": "uint256[]",
                "name": "tokenIds",
                "type": "uint256[]"
            }
        ],
        "name": "sweepERC721Tokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "sweepEther",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
]

const CONTRACT_ADDRESS = '0x88e24bB3a5EcE2a8f92CfA5986DF87182513f465'; // Replace with your contract's address

async function main() {

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, blockchainConfig.signer);

    const tokenAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'; // Replace with the ERC20 token's address you want to sweep
    const amount = ethers.parseUnits('5', 6);

    const tx = await contract.sweepERC20Token(tokenAddress, amount);
    console.log(`Transaction hash: ${tx.hash}`);

    await tx.wait();
    console.log(`Transaction ${tx.hash} confirmed!`);
}

main().catch(console.error);
