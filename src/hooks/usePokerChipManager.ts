import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { overProtocol } from '@/config/wagmi';
import { TOKEN_ADDRESSES, WOVER_DECIMALS } from '@/hooks/useTokenBalance';

// Contract address - will be set after deployment
// For now, using a placeholder that should be replaced with actual deployed address
export const POKER_CHIP_MANAGER_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// ABI for the PokerChipManager contract
export const POKER_CHIP_MANAGER_ABI = [
  {
    inputs: [{ name: 'woverAmount', type: 'uint256' }],
    name: 'buyIn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'chipAmount', type: 'uint256' }],
    name: 'cashOut',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getPlayerChips',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getLockedWover',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getPlayerFullBalance',
    outputs: [
      { name: 'available', type: 'uint256' },
      { name: 'woverDeposited', type: 'uint256' },
      { name: 'woverEquivalent', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'CHIPS_PER_WOVER',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MIN_DEPOSIT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MIN_WITHDRAWAL_CHIPS',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 Approve ABI for WOVER token
export const ERC20_APPROVE_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function usePokerChipManager(address?: `0x${string}`) {
  // Check if contract is deployed (not zero address)
  const isContractDeployed = POKER_CHIP_MANAGER_ADDRESS !== '0x0000000000000000000000000000000000000000';

  // Read player chips from contract
  const { data: playerChips, refetch: refetchChips } = useReadContract({
    address: POKER_CHIP_MANAGER_ADDRESS,
    abi: POKER_CHIP_MANAGER_ABI,
    functionName: 'getPlayerChips',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isContractDeployed,
    },
  });

  // Read full balance
  const { data: fullBalance, refetch: refetchFullBalance } = useReadContract({
    address: POKER_CHIP_MANAGER_ADDRESS,
    abi: POKER_CHIP_MANAGER_ABI,
    functionName: 'getPlayerFullBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isContractDeployed,
    },
  });

  // Check allowance for WOVER token
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESSES.WOVER,
    abi: ERC20_APPROVE_ABI,
    functionName: 'allowance',
    args: address ? [address, POKER_CHIP_MANAGER_ADDRESS] : undefined,
    query: {
      enabled: !!address && isContractDeployed,
    },
  });

  // Write contract functions
  const { writeContract, data: txHash, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Approve WOVER spending
  const approveWover = async (amount: string) => {
    if (!address) return;
    
    const amountWei = parseUnits(amount, WOVER_DECIMALS);
    
    writeContract({
      address: TOKEN_ADDRESSES.WOVER,
      abi: ERC20_APPROVE_ABI,
      functionName: 'approve',
      args: [POKER_CHIP_MANAGER_ADDRESS, amountWei],
      chain: overProtocol,
      account: address,
    });
  };

  // Buy chips with WOVER (deposit)
  const buyIn = async (woverAmount: string) => {
    if (!address || !isContractDeployed) return;
    
    const amountWei = parseUnits(woverAmount, WOVER_DECIMALS);
    
    // Check if approval is needed
    if (!allowance || allowance < amountWei) {
      // First approve, then buyIn will be called after approval
      await approveWover(woverAmount);
      return;
    }
    
    writeContract({
      address: POKER_CHIP_MANAGER_ADDRESS,
      abi: POKER_CHIP_MANAGER_ABI,
      functionName: 'buyIn',
      args: [amountWei],
      chain: overProtocol,
      account: address,
    });
  };

  // Cash out chips for WOVER (withdrawal)
  const cashOut = async (chipAmount: string) => {
    if (!address || !isContractDeployed) return;
    
    const amountWei = parseUnits(chipAmount, WOVER_DECIMALS);
    
    writeContract({
      address: POKER_CHIP_MANAGER_ADDRESS,
      abi: POKER_CHIP_MANAGER_ABI,
      functionName: 'cashOut',
      args: [amountWei],
      chain: overProtocol,
      account: address,
    });
  };

  const refetchAll = () => {
    refetchChips();
    refetchFullBalance();
    refetchAllowance();
  };

  return {
    // State
    isContractDeployed,
    playerChips: playerChips ? formatUnits(playerChips, WOVER_DECIMALS) : '0',
    fullBalance: fullBalance ? {
      available: formatUnits(fullBalance[0], WOVER_DECIMALS),
      woverDeposited: formatUnits(fullBalance[1], WOVER_DECIMALS),
      woverEquivalent: formatUnits(fullBalance[2], WOVER_DECIMALS),
    } : null,
    allowance: allowance ? formatUnits(allowance, WOVER_DECIMALS) : '0',
    
    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    txHash,
    
    // Actions
    approveWover,
    buyIn,
    cashOut,
    refetchAll,
  };
}
