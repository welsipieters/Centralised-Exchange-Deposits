// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DepositContract {
    address public owner;
    address public coldStorage;

    constructor(address _coldStorage) {
        owner = msg.sender;
        coldStorage = _coldStorage;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function sweepERC20Token(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 tokenBalance = token.balanceOf(address(this));
        if (tokenBalance > 0) {
            require(token.transferFrom(address(this), coldStorage, tokenBalance), "Token transfer failed");
        }
    }

    function sweepERC721Token(address nftAddress, uint256 startIndex, uint256 endIndex) external onlyOwner {
        IERC721 nft = IERC721(nftAddress);
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint256 tokenId = nft.tokenOfOwnerByIndex(address(this), i);
            nft.transferFrom(address(this), coldStorage, tokenId);
        }
    }

    function sweepEther() external onlyOwner {
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            payable(coldStorage).transfer(ethBalance);
        }
    }

    // Allow the contract to accept ether
    receive() external payable {}
}