
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing required contracts and interfaces from OpenZeppelin and local files
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./DepositContract.sol";

/**
 * @title DepositAddressFactory
 * @notice This contract facilitates the creation of new DepositContract instances. 
 * It also manages administrative tasks like pausing/unpausing operations, 
 * updating cold storage addresses, and maintaining a list of contract admins.
 */
contract DepositAddressFactory is Pausable {

    // Address where assets are stored securely
    address public coldStorage;

    // Mapping to track contracts deployed by this factory
    mapping(address => bool) public deployedContracts;

    // Mapping to track admin addresses
    mapping(address => bool) public admins;

    event ContractDeployed(address contractAddress);

    // Modifier to ensure that the function is only callable by an admin
    modifier onlyAdmin() {
        require(admins[msg.sender], "Access restricted to admins");
        _;
    }

    /**
     * @dev Constructor to initialize the cold storage address and set the deployer as an admin.
     * @param _coldStorage Address of the cold storage.
     */
    constructor(address _coldStorage) {
        require(_coldStorage != address(0), "Invalid cold storage address");
        coldStorage = _coldStorage;
        admins[msg.sender] = true;
    }

    /**
     * @notice Deploys a new instance of the DepositContract.
     * @return Address of the newly deployed contract.
     */
    function deployNewContract() external onlyAdmin whenNotPaused returns(address) {
        DepositContract newContract = new DepositContract(address(this));
        deployedContracts[address(newContract)] = true;
        emit ContractDeployed(address(newContract));
        return address(newContract);
    }

    /**
     * @notice Deploys multiple instances of the DepositContract.
     * @param count Number of contracts to deploy.
     * @return An array of addresses of the newly deployed contracts.
     */
    function deployMultipleContracts(uint256 count) external onlyAdmin whenNotPaused returns(address[] memory) {
        address[] memory deployedAddresses = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            DepositContract newContract = new DepositContract(address(this));
            deployedContracts[address(newContract)] = true;
            deployedAddresses[i] = address(newContract);
            emit ContractDeployed(address(newContract));
        }
        return deployedAddresses;
    }

    /**
     * @notice Adds a new admin.
     * @param _admin Address of the new admin.
     */
    function addAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "Invalid admin address");
        admins[_admin] = true;
    }

    /**
     * @notice Removes an admin.
     * @param _admin Address of the admin to be removed.
     */
    function removeAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "Invalid admin address");
        admins[_admin] = false;
    }

    /**
     * @notice Returns the cold storage address.
     * @return Address of the cold storage.
     */
    function getColdStorageAddress() external view returns (address) {
        return coldStorage;
    }

    /**
     * @notice Updates the cold storage address.
     * @param _coldStorage New cold storage address.
     */
    function setColdStorageAddress(address _coldStorage) external onlyAdmin {
        require(_coldStorage != address(0), "Invalid cold storage address");
        coldStorage = _coldStorage;
    }

    /**
     * @notice Pauses all contract operations.
     */
    function pauseContract() external onlyAdmin {
        _pause();
    }

    /**
     * @notice Resumes all contract operations.
     */
    function unpauseContract() external onlyAdmin {
        _unpause();
    }
}
