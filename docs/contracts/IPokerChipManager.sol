// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPokerChipManager
 * @dev Interface for PokerChipManager contract - used by frontend/backend
 */
interface IPokerChipManager {
    // Events
    event Deposit(address indexed player, uint256 woverAmount, uint256 chipsGranted, uint256 timestamp);
    event Withdrawal(address indexed player, uint256 woverAmount, uint256 chipsSpent, uint256 timestamp);
    event ChipsLockedToTable(bytes32 indexed tableId, address indexed player, uint256 chips, uint256 timestamp);
    event ChipsUnlockedFromTable(bytes32 indexed tableId, address indexed player, uint256 chips, uint256 timestamp);
    event GameSettled(bytes32 indexed tableId, address[] players, uint256[] finalChips, uint256 timestamp);

    // Player functions
    function buyIn(uint256 woverAmount) external;
    function cashOut(uint256 chipAmount) external;

    // Admin functions (onlyOwner)
    function lockChipsToTable(bytes32 tableId, address player, uint256 chipAmount) external;
    function unlockChipsFromTable(bytes32 tableId, address player, uint256 chipAmount) external;
    function settleGame(bytes32 tableId, address[] calldata players, uint256[] calldata finalChips) external;
    function emergencyUnlock(bytes32 tableId, address player) external;

    // View functions
    function CHIPS_PER_WOVER() external view returns (uint256);
    function chipBalance(address player) external view returns (uint256);
    function lockedWover(address player) external view returns (uint256);
    function tableChips(bytes32 tableId, address player) external view returns (uint256);
    function tableActive(bytes32 tableId) external view returns (bool);
    function getPlayerChips(address player) external view returns (uint256);
    function getLockedWover(address player) external view returns (uint256);
    function getTableChips(bytes32 tableId, address player) external view returns (uint256);
    function isTableActive(bytes32 tableId) external view returns (bool);
    function getPlayerFullBalance(address player) external view returns (
        uint256 available,
        uint256 woverDeposited,
        uint256 woverEquivalent
    );
}
