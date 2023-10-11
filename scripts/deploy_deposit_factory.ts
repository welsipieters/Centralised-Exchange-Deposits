import { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts from ${deployer.address}`);

    // Validate cold storage address
    const coldStorageAddress = process.env.COLD_STORAGE_ADDRESS;
    if (!ethers.isAddress(coldStorageAddress)) {
        throw new Error(`Invalid cold storage address: ${coldStorageAddress}`);
    }

    // Deploy DepositContract (logic contract) without initializing the factory address
    const DepositContract = await ethers.getContractFactory("DepositContract");
    const depositContract = await DepositContract.deploy();
    await depositContract.waitForDeployment();
    console.log(`DepositContract (logic contract) deployed to: ${depositContract.target}`);

    // Deploy DepositAddressFactory with cold storage and logic contract addresses
    const DepositAddressFactory = await ethers.getContractFactory("DepositAddressFactory");
    const depositAddressFactory = await DepositAddressFactory.deploy(coldStorageAddress, depositContract.target);
    await depositAddressFactory.waitForDeployment();
    console.log(`DepositAddressFactory deployed to: ${depositAddressFactory.target}`);

    // Now, set the factory address in the DepositContract
    await depositContract.initialize(depositAddressFactory.target);
    console.log(`Set factory address in DepositContract to: ${depositAddressFactory.target}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
