
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing required interfaces and contracts from OpenZeppelin and local files
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./DepositAddressFactory.sol";

/**
 * @title DepositContract
 * @notice This contract is designed to allow for secure deposits, management,
 * and transfer of ERC20 tokens, ERC721 tokens, and Ether to a designated cold storage.
 */
contract DepositContract {

    // Reference to the factory contract that deployed this contract
    DepositAddressFactory public factory;

    // Modifier to ensure that the function is only callable by the factory's designated admins
    modifier onlyFactoryAdmin() {
        require(factory.admins(msg.sender), "Access restricted to factory admins");
        _;
    }

    // Modifier to ensure that the function is only callable when the factory is not paused
    modifier ifFactoryNotPaused() {
        require(!factory.paused(), "Factory operations are paused");
        _;
    }

    // Constructor to initialize the factory reference
    constructor() {
        factory = DepositAddressFactory(msg.sender);
    }

    /**
     * @notice Transfers ERC20 tokens from this contract to the cold storage address.
     * @param tokenAddress The address of the ERC20 token to be transferred.
     */
    function sweepERC20Token(address tokenAddress) external onlyFactoryAdmin ifFactoryNotPaused {
        IERC20 token = IERC20(tokenAddress);
        address coldStorage = factory.getColdStorageAddress();
        uint256 tokenBalance = token.balanceOf(address(this));
        require(tokenBalance > 0, "No tokens available for transfer");
        require(token.transfer(coldStorage, tokenBalance), "Transfer of ERC20 tokens failed");
    }

    /**
     * @notice Transfers ERC721 tokens from this contract to the cold storage address.
     * @param nftAddress The address of the ERC721 token contract.
     * @param tokenIds The IDs of the ERC721 tokens to be transferred.
     */
    function sweepERC721Tokens(address nftAddress, uint256[] calldata tokenIds) external onlyFactoryAdmin ifFactoryNotPaused {
        IERC721 nft = IERC721(nftAddress);
        address coldStorage = factory.getColdStorageAddress();
        for (uint256 i = 0; i < tokenIds.length; i++) {
            nft.safeTransferFrom(address(this), coldStorage, tokenIds[i]);
        }
    }

    /**
     * @notice Transfers the Ether held in this contract to the cold storage address.
     */
    function sweepEther() external onlyFactoryAdmin ifFactoryNotPaused {
        uint256 ethBalance = address(this).balance;
        require(ethBalance > 0, "No Ether available for transfer");
        address coldStorage = factory.getColdStorageAddress();
        payable(coldStorage).transfer(ethBalance);
    }

    // Fallback function to allow the contract to receive Ether transfers
    receive() external payable {}
}
