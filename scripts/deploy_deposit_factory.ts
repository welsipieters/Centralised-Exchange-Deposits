import { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(`Deploying DepositAddressFactory from ${deployer.address}`);

    const coldStorageAddress = process.env.COLD_STORAGE_ADDRESS; // Replace with the actual cold storage address

    if (!ethers.isAddress(coldStorageAddress)) {
        throw new Error(`Invalid cold storage address: ${coldStorageAddress}`);
    }

    const DepositAddressFactory = await ethers.getContractFactory("DepositAddressFactory");
    const depositAddressFactory = await DepositAddressFactory.deploy(coldStorageAddress);

    await depositAddressFactory.waitForDeployment();

    console.log(`DepositAddressFactory deployed to: ${depositAddressFactory.target}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
