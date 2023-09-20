// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DepositAddressFactory {
    address public owner;
    address public coldStorage;
    DepositContract[] public contracts;

    constructor(address _coldStorage) {
        owner = msg.sender;
        coldStorage = _coldStorage;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function deployNewContract() external onlyOwner returns(address) {
        DepositContract newContract = new DepositContract(coldStorage);
        contracts.push(newContract);
        return address(newContract);
    }

    function getDeployedContracts() external view returns (DepositContract[] memory) {
        return contracts;
    }
}
