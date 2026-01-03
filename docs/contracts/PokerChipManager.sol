// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PokerChipManager
 * @dev Manages WOVER token deposits/withdrawals for O'Rocket Hold'em poker game
 * 
 * SECURITY NOTES:
 * - Only owner (admin backend) can lock chips to tables and settle games
 * - ReentrancyGuard prevents reentrancy attacks on all external functions
 * - Chips are locked when player joins a table, preventing double-spending
 * - Settlement can only be done by owner after game ends on backend
 */
contract PokerChipManager is Ownable, ReentrancyGuard {
    IERC20 public immutable woverToken;
    
    // Conversion rate: 1 WOVER = 100 chips (allows for granular betting)
    uint256 public constant CHIPS_PER_WOVER = 100;
    
    // Minimum deposit/withdrawal amounts
    uint256 public constant MIN_DEPOSIT = 1 ether; // 1 WOVER minimum
    uint256 public constant MIN_WITHDRAWAL_CHIPS = 100; // 1 WOVER worth of chips
    
    // Player chip balances (available for play)
    mapping(address => uint256) public chipBalance;
    
    // Player locked WOVER (total deposited, for tracking)
    mapping(address => uint256) public lockedWover;
    
    // Table-specific chip locks: tableId => player => lockedChips
    mapping(bytes32 => mapping(address => uint256)) public tableChips;
    
    // Table active status (prevents double settlement)
    mapping(bytes32 => bool) public tableActive;
    
    // Events for backend synchronization
    event Deposit(
        address indexed player, 
        uint256 woverAmount, 
        uint256 chipsGranted,
        uint256 timestamp
    );
    
    event Withdrawal(
        address indexed player, 
        uint256 woverAmount, 
        uint256 chipsSpent,
        uint256 timestamp
    );
    
    event ChipsLockedToTable(
        bytes32 indexed tableId, 
        address indexed player, 
        uint256 chips,
        uint256 timestamp
    );
    
    event ChipsUnlockedFromTable(
        bytes32 indexed tableId, 
        address indexed player, 
        uint256 chips,
        uint256 timestamp
    );
    
    event GameSettled(
        bytes32 indexed tableId, 
        address[] players, 
        uint256[] finalChips,
        uint256 timestamp
    );
    
    event EmergencyUnlock(
        bytes32 indexed tableId,
        address indexed player,
        uint256 chips,
        uint256 timestamp
    );

    // Custom errors for gas efficiency
    error ZeroAmount();
    error InsufficientChips();
    error InsufficientWover();
    error TransferFailed();
    error TableNotActive();
    error TableAlreadyActive();
    error ArrayLengthMismatch();
    error PlayerNotAtTable();
    error BelowMinimumDeposit();
    error BelowMinimumWithdrawal();

    constructor(address _woverToken) {
        require(_woverToken != address(0), "Invalid token address");
        woverToken = IERC20(_woverToken);
    }

    /**
     * @dev Player deposits WOVER tokens to receive chips
     * @param woverAmount Amount of WOVER to deposit (in wei, 18 decimals)
     */
    function buyIn(uint256 woverAmount) external nonReentrant {
        if (woverAmount == 0) revert ZeroAmount();
        if (woverAmount < MIN_DEPOSIT) revert BelowMinimumDeposit();
        
        // Transfer WOVER from player to contract
        bool success = woverToken.transferFrom(msg.sender, address(this), woverAmount);
        if (!success) revert TransferFailed();
        
        // Calculate chips (1 WOVER = 100 chips)
        // woverAmount is in wei (18 decimals), so we divide by 1e18 first
        uint256 chips = (woverAmount / 1 ether) * CHIPS_PER_WOVER;
        
        // Update balances
        lockedWover[msg.sender] += woverAmount;
        chipBalance[msg.sender] += chips;
        
        emit Deposit(msg.sender, woverAmount, chips, block.timestamp);
    }

    /**
     * @dev Player cashes out chips for WOVER tokens
     * @param chipAmount Amount of chips to cash out
     */
    function cashOut(uint256 chipAmount) external nonReentrant {
        if (chipAmount == 0) revert ZeroAmount();
        if (chipAmount < MIN_WITHDRAWAL_CHIPS) revert BelowMinimumWithdrawal();
        if (chipBalance[msg.sender] < chipAmount) revert InsufficientChips();
        
        // Calculate WOVER amount (100 chips = 1 WOVER)
        uint256 woverAmount = (chipAmount / CHIPS_PER_WOVER) * 1 ether;
        if (woverAmount == 0) revert BelowMinimumWithdrawal();
        if (lockedWover[msg.sender] < woverAmount) revert InsufficientWover();
        
        // Update balances first (checks-effects-interactions pattern)
        chipBalance[msg.sender] -= chipAmount;
        lockedWover[msg.sender] -= woverAmount;
        
        // Transfer WOVER back to player
        bool success = woverToken.transfer(msg.sender, woverAmount);
        if (!success) revert TransferFailed();
        
        emit Withdrawal(msg.sender, woverAmount, chipAmount, block.timestamp);
    }

    /**
     * @dev Lock chips when player joins a table (called by backend)
     * @param tableId Unique identifier for the poker table
     * @param player Address of the player joining
     * @param chipAmount Amount of chips to lock for the game
     */
    function lockChipsToTable(
        bytes32 tableId,
        address player,
        uint256 chipAmount
    ) external onlyOwner nonReentrant {
        if (chipAmount == 0) revert ZeroAmount();
        if (chipBalance[player] < chipAmount) revert InsufficientChips();
        
        // Mark table as active if not already
        if (!tableActive[tableId]) {
            tableActive[tableId] = true;
        }
        
        // Move chips from available to locked
        chipBalance[player] -= chipAmount;
        tableChips[tableId][player] += chipAmount;
        
        emit ChipsLockedToTable(tableId, player, chipAmount, block.timestamp);
    }

    /**
     * @dev Unlock chips when player leaves table without game end
     * @param tableId Unique identifier for the poker table
     * @param player Address of the player leaving
     * @param chipAmount Amount of chips to unlock
     */
    function unlockChipsFromTable(
        bytes32 tableId,
        address player,
        uint256 chipAmount
    ) external onlyOwner nonReentrant {
        if (!tableActive[tableId]) revert TableNotActive();
        if (tableChips[tableId][player] < chipAmount) revert InsufficientChips();
        
        // Move chips from locked back to available
        tableChips[tableId][player] -= chipAmount;
        chipBalance[player] += chipAmount;
        
        emit ChipsUnlockedFromTable(tableId, player, chipAmount, block.timestamp);
    }

    /**
     * @dev Settle game and distribute final chip amounts (called by backend after game ends)
     * @param tableId Unique identifier for the poker table
     * @param players Array of player addresses at the table
     * @param finalChips Array of final chip amounts for each player
     * 
     * NOTE: finalChips includes winnings. Total should equal sum of all locked chips.
     */
    function settleGame(
        bytes32 tableId,
        address[] calldata players,
        uint256[] calldata finalChips
    ) external onlyOwner nonReentrant {
        if (!tableActive[tableId]) revert TableNotActive();
        if (players.length != finalChips.length) revert ArrayLengthMismatch();
        if (players.length == 0) revert ZeroAmount();
        
        // Calculate total chips for validation
        uint256 totalLockedChips = 0;
        uint256 totalFinalChips = 0;
        
        for (uint i = 0; i < players.length; i++) {
            totalLockedChips += tableChips[tableId][players[i]];
            totalFinalChips += finalChips[i];
        }
        
        // Verify chip conservation (no chips created or destroyed)
        require(totalFinalChips == totalLockedChips, "Chip count mismatch");
        
        // Distribute final chips
        for (uint i = 0; i < players.length; i++) {
            // Clear table lock
            tableChips[tableId][players[i]] = 0;
            // Add final chips to available balance
            chipBalance[players[i]] += finalChips[i];
        }
        
        // Mark table as inactive
        tableActive[tableId] = false;
        
        emit GameSettled(tableId, players, finalChips, block.timestamp);
    }

    /**
     * @dev Emergency unlock for stuck games (only owner)
     * @param tableId Table to unlock
     * @param player Player whose chips to unlock
     */
    function emergencyUnlock(
        bytes32 tableId,
        address player
    ) external onlyOwner nonReentrant {
        uint256 lockedAmount = tableChips[tableId][player];
        if (lockedAmount == 0) revert PlayerNotAtTable();
        
        tableChips[tableId][player] = 0;
        chipBalance[player] += lockedAmount;
        
        emit EmergencyUnlock(tableId, player, lockedAmount, block.timestamp);
    }

    /**
     * @dev Deactivate a table without settling (for abandoned games)
     * @param tableId Table to deactivate
     */
    function deactivateTable(bytes32 tableId) external onlyOwner {
        tableActive[tableId] = false;
    }

    // ============ View Functions ============

    function getPlayerChips(address player) external view returns (uint256) {
        return chipBalance[player];
    }
    
    function getLockedWover(address player) external view returns (uint256) {
        return lockedWover[player];
    }
    
    function getTableChips(bytes32 tableId, address player) external view returns (uint256) {
        return tableChips[tableId][player];
    }
    
    function isTableActive(bytes32 tableId) external view returns (bool) {
        return tableActive[tableId];
    }
    
    function getPlayerFullBalance(address player) external view returns (
        uint256 available,
        uint256 woverDeposited,
        uint256 woverEquivalent
    ) {
        available = chipBalance[player];
        woverDeposited = lockedWover[player];
        woverEquivalent = (available / CHIPS_PER_WOVER) * 1 ether;
    }
}
