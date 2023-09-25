import {ethers} from "hardhat";
import {parseUnits} from "ethers";

const { expect } = require("chai");

describe("DepositContract", function () {
    let DepositAddressFactory, DepositContract, factory, depositContract, owner, addr1, coldStorage;

    before(async () => {
        // Get the ContractFactory and Signers here.
        DepositAddressFactory = await ethers.getContractFactory("DepositAddressFactory");
        DepositContract = await ethers.getContractFactory("DepositContract");

        [owner, addr1, coldStorage] = await ethers.getSigners();

        // Deploy DepositAddressFactory and DepositContract here.
        factory = await DepositAddressFactory.deploy(coldStorage.address);

        // Assume deployNewContract deploys a new DepositContract
        const deployTx = await factory.deployNewContract(/* params */);
        const receipt = await deployTx.wait();

        // Get the deployed DepositContract address from the event.
        const event = receipt.logs?.find((e) => e.fragment.name === "ContractDeployed");
        const deployedAddress = event.args?.[0];

        depositContract = await DepositContract.attach(deployedAddress);
    });

    beforeEach(async () => {
        await unpauseIfPaused(factory);
    });

    describe("Deployment", function () {
        it("Should set the right factory", async function () {
            expect(await depositContract.factory()).to.equal(factory.target);
        });
    });

    describe("sweepERC20Token", function () {
        let ERC20, erc20, amount;

        beforeEach(async () => {
            ERC20 = await ethers.getContractFactory("ERC20Mock");
            erc20 = await ERC20.deploy("test", "TEST");

            amount = parseUnits("10", 18);
            await erc20.mint(owner.address, amount);
            await erc20.connect(owner).transfer(depositContract.target, amount); // Transfer tokens to DepositContract
        });

        it("Should sweep ERC20 tokens to cold storage", async function () {
            await depositContract.sweepERC20Token(erc20.target);
            expect(await erc20.balanceOf(factory.coldStorage())).to.equal(amount);
        });

        it("Should emit Transfer event", async function () {
            await expect(depositContract.sweepERC20Token(erc20.target))
                .to.emit(erc20, "Transfer")
                .withArgs(depositContract.target, await factory.coldStorage(), amount);
        });

        it("Should revert if not admin", async function () {
            const nonAdmin = depositContract.connect(addr1); // Assume addr1 is not an admin
            await expect(nonAdmin.sweepERC20Token(erc20.target)).to.be.revertedWith("Access restricted to factory admins");
        });

        it("Should revert if factory is paused", async function () {
            await factory.pauseContract();
            await expect(depositContract.sweepERC20Token(erc20.target)).to.be.revertedWith("Factory operations are paused");
        });
    });

    describe("sweepERC721Token", function () {
        let ERC721, erc721, tokenId;

        beforeEach(async () => {
            ERC721 = await ethers.getContractFactory("ERC721Mock"); // Replace with your ERC721 contract
            erc721 = await ERC721.deploy("test", "TEST");

            tokenId = 1;
            await erc721.mint(depositContract.target, tokenId); // Mint token to DepositContract
        });

        it("Should sweep ERC721 token to cold storage", async function () {
            await depositContract.sweepERC721Tokens(erc721.target, [tokenId]);
            expect(await erc721.ownerOf(tokenId)).to.equal(await factory.coldStorage());
        });

        it("Should emit Transfer event", async function () {
            await expect(depositContract.sweepERC721Tokens(erc721.target, [tokenId]))
                .to.emit(erc721, "Transfer")
                .withArgs(depositContract.target, await factory.coldStorage(), tokenId);
        });

        it("Should revert if not admin", async function () {
            const nonAdmin = depositContract.connect(addr1);
            await expect(nonAdmin.sweepERC721Tokens(erc721.target, [tokenId])).to.be.revertedWith("Access restricted to factory admins");
        });

        it("Should revert if factory is paused", async function () {
            await factory.pauseContract();
            await expect(depositContract.sweepERC721Tokens(erc721.target, [tokenId])).to.be.revertedWith("Factory operations are paused");
        });
    });

    describe("sweepEther", function () {
        let amount;

        beforeEach(async () => {
            amount = ethers.parseEther("1"); // 1 Ethe

            await owner.sendTransaction({
                to: depositContract.target,
                value: amount
            });
        });

        it("Should sweep Ether to cold storage", async function () {
            const coldStorageInitialBalance = await ethers.provider.getBalance(factory.coldStorage());
            await depositContract.sweepEther();

            const coldStorageFinalBalance = await ethers.provider.getBalance(factory.coldStorage());
            expect(coldStorageFinalBalance).to.equal(coldStorageInitialBalance +amount);
        });

        it("Should revert if not admin", async function () {
            const nonAdmin = depositContract.connect(addr1);
            await expect(nonAdmin.sweepEther()).to.be.revertedWith("Access restricted to factory admins");
        });

        it("Should revert if factory is paused", async function () {
            await factory.pauseContract();
            await expect(depositContract.sweepEther()).to.be.revertedWith("Factory operations are paused");
        });
    });

    describe("Fallback and Receive", function () {
        it("Should correctly receive Ether", async function () {

            const amount = ethers.parseEther("1"); // 1 Ether

            const contractInitialBalance = await ethers.provider.getBalance(depositContract.target);

            await owner.sendTransaction({ to: depositContract.target, value: amount });

            const contractFinalBalance = await ethers.provider.getBalance(depositContract.target);

            expect(contractFinalBalance).to.equal(contractInitialBalance + amount);
        });

        it("Should revert if sending Ether when contract is paused", async function () {
            await pauseIfNotPaused(factory);

            const amount = ethers.parseEther("1"); // 1 Ether

            await expect(owner.sendTransaction({ to: depositContract.target, value: amount }))
                .to.be.revertedWith("Factory operations are paused"); // Replace with your revert message
        });
    });
});

const pauseIfNotPaused = async (contract) => {
    const isPaused = await contract.paused();

    if (!isPaused) {
        await contract.pauseContract();
    }
}

const unpauseIfPaused = async (contract) => {
    const isPaused = await contract.paused();

    if (isPaused) {
        await contract.unpauseContract();
    }
}