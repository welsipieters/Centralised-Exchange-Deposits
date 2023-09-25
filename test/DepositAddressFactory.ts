import { ethers } from "hardhat";

const { expect } = require("chai");

describe("DepositAddressFactory", function () {
    let DepositAddressFactory;
    let factory;
    let deployer;
    let coldStorage;

    before(async () => {
        // Get the ContractFactory and Signers here
        DepositAddressFactory = await ethers.getContractFactory("DepositAddressFactory");
        [deployer, coldStorage] = await ethers.getSigners();
    });

    beforeEach(async () => {
        // Deploy a new DepositAddressFactory contract for each test
        factory = await DepositAddressFactory.deploy(coldStorage.address);
    });

    describe("Contract Deployment and Initialization", function () {
        it("Should deploy the contract correctly", async function () {
            expect(factory.target).to.properAddress; // Check if the address is valid
        });

        it("Should correctly initialize with the provided cold storage address", async function () {
            const actualColdStorageAddress = await factory.coldStorage();
            expect(actualColdStorageAddress).to.equal(coldStorage.address);
        });

        it("Should set the deployer as an admin", async function () {
            const isAdmin = await factory.admins(deployer.address);
            expect(isAdmin).to.be.true;
        });

        it("Should revert if initialized with an invalid cold storage address", async function () {
            // Attempt to deploy the contract with an invalid address (0x0) and expect it to be reverted
            await expect(DepositAddressFactory.deploy("0x0000000000000000000000000000000000000000"))
                .to.be.revertedWith("Invalid cold storage address");
        });
    });

    describe("addAdmin and removeAdmin Functions", function () {
        it("Should correctly add a new admin", async function () {
            const [_, newAdmin] = await ethers.getSigners();
            await factory.addAdmin(newAdmin.address);
            const isAdmin = await factory.admins(newAdmin.address);
            expect(isAdmin).to.be.true;
        });

        it("Should correctly remove an admin", async function () {
            const [_, removedAdmin] = await ethers.getSigners();
            await factory.addAdmin(removedAdmin.address); // First add a new admin
            await factory.removeAdmin(removedAdmin.address); // Then remove the admin
            const isAdmin = await factory.admins(removedAdmin.address);
            expect(isAdmin).to.be.false;
        });

        it("Should revert if non-admins try to add or remove admins", async function () {
            const [_, nonAdmin] = await ethers.getSigners();
            await expect(factory.connect(nonAdmin).addAdmin(nonAdmin.address))
                .to.be.revertedWith("Access restricted to admins");
            await expect(factory.connect(nonAdmin).removeAdmin(deployer.address))
                .to.be.revertedWith("Access restricted to admins");
        });
    });

    describe("deployNewContract and deployMultipleContracts Functions", function () {
        it("Should correctly deploy a new DepositContract instance", async function () {
            const tx = await factory.connect(deployer).deployNewContract(); // Assuming deployer is an admin
            const receipt = await tx.wait();

            // Extracting the deployed contract address from the event
            const deployedAddress = receipt.logs[0]['args'][0];

            // Checking if the event was emitted and if the deployed address is valid
            expect(deployedAddress).to.properAddress;

            // Check the deployedContracts mapping or equivalent
            // Assuming you have a way to check if the contract is in the deployedContracts mapping
            expect(await factory.deployedContracts(deployedAddress)).to.be.true;
        });

        it("Should correctly deploy multiple DepositContract instances", async function () {
            const count = 3; // Example with 3 contracts
            const tx = await factory.connect(deployer).deployMultipleContracts(count); // Assuming deployer is an admin
            const receipt = await tx.wait();

            // Expect multiple ContractDeployed events
            const deployedEvents = receipt.logs.filter(e => e.fragment.name === 'ContractDeployed') || [];
            expect(deployedEvents).to.have.lengthOf(count);

            for (const event of deployedEvents) {
                const deployedAddress = event.args?.[0];
                expect(deployedAddress).to.properAddress;

                // Check the deployedContracts mapping or equivalent for each deployed contract
                expect(await factory.deployedContracts(deployedAddress)).to.be.true;
            }
        });
    });

    describe("setColdStorageAddress Function", function () {
        it("Should correctly update the cold storage address", async function () {
            const [_, newColdStorage] = await ethers.getSigners();
            await factory.setColdStorageAddress(newColdStorage.address);
            const actualColdStorageAddress = await factory.coldStorage();
            expect(actualColdStorageAddress).to.equal(newColdStorage.address);
        });

        it("Should revert if non-admins try to set the cold storage address", async function () {
            const [_, nonAdmin, newColdStorage] = await ethers.getSigners();
            await expect(factory.connect(nonAdmin).setColdStorageAddress(newColdStorage.address))
                .to.be.revertedWith("Access restricted to admins");
        });

        it("Should revert if trying to set an invalid cold storage address", async function () {
            await expect(factory.setColdStorageAddress("0x0000000000000000000000000000000000000000"))
                .to.be.revertedWith("Invalid cold storage address");
        });
    });

    describe("pauseContract and unpauseContract Functions", function () {
        it("Should correctly pause the contract", async function () {
            await factory.pauseContract();
            const isPaused = await factory.paused();
            expect(isPaused).to.be.true;
        });

        it("Should correctly unpause the contract", async function () {
            await factory.pauseContract();
            await factory.unpauseContract();
            const isPaused = await factory.paused();
            expect(isPaused).to.be.false;
        });

        it("Should revert if non-admins try to pause or unpause the contract", async function () {
            const [_, nonAdmin] = await ethers.getSigners();
            await expect(factory.connect(nonAdmin).pauseContract())
                .to.be.revertedWith("Access restricted to admins");
            await expect(factory.connect(nonAdmin).unpauseContract())
                .to.be.revertedWith("Access restricted to admins");
        });
    });

});
