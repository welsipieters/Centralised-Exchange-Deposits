// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract DepositContract is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    address public coldStorage;

    // Events
    event EtherSwept(address indexed to, uint256 amount);
    event ERC20TokenSwept(address indexed tokenAddress, address indexed to, uint256 amount);
    event ERC721TokenSwept(address indexed nftAddress, uint256 tokenId, address indexed to);

    constructor(address _coldStorage) {
        _setupRole(OWNER_ROLE, msg.sender);
        coldStorage = _coldStorage;
    }

    modifier onlyOwner() {
        require(hasRole(OWNER_ROLE, msg.sender), "Not authorized");
        _;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function sweepERC20Token(address tokenAddress) external onlyOwner whenNotPaused nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        uint256 tokenBalance = token.balanceOf(address(this));
        if (tokenBalance > 0) {
            require(token.transfer(coldStorage, tokenBalance), "Token transfer failed");
            emit ERC20TokenSwept(tokenAddress, coldStorage, tokenBalance);
        }
    }

    function sweepERC721Tokens(address nftAddress, uint256[] memory tokenIds) external onlyOwner whenNotPaused nonReentrant {
        IERC721 nft = IERC721(nftAddress);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(nft.ownerOf(tokenId) == address(this), "Token not owned by contract");
            nft.transferFrom(address(this), coldStorage, tokenId);
            emit ERC721TokenSwept(nftAddress, tokenId, coldStorage);
        }
    }

    function sweepEther() external onlyOwner whenNotPaused nonReentrant {
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            payable(coldStorage).transfer(ethBalance);
            emit EtherSwept(coldStorage, ethBalance);
        }
    }

    // Allow the contract to accept ether
    receive() external payable {}
}
