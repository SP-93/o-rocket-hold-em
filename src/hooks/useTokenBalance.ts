import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Token addresses from deployment config
export const TOKEN_ADDRESSES = {
  // Stablecoins for private table fees only
  USDT: '0xA510432E4aa60B4acd476fb850EC84B7EE226b2d' as `0x${string}`,
  USDC: '0x8712796136Ac8e0EEeC123251ef93702f265aa80' as `0x${string}`,
  // WOVER (Wrapped OVER) for chip purchases - 1 WOVER = 1 CHIP
  WOVER: '0x59c914C8ac6F212bb655737CC80d9Abc79A1e273' as `0x${string}`,
} as const;

// Admin wallet for receiving payments
export const ADMIN_WALLET = '0x8334966329b7f4b459633696A8CA59118253bC89' as `0x${string}`;

// Token decimals
export const STABLECOIN_DECIMALS = 6; // USDT/USDC have 6 decimals
export const WOVER_DECIMALS = 18; // WOVER has 18 decimals (like ETH)

// Legacy export for backwards compatibility with private table fees
export const TOKEN_DECIMALS = STABLECOIN_DECIMALS;

// Chip conversion: 1 WOVER = 1 CHIP (with 18 decimal precision)
export const CHIPS_PER_WOVER = 1;

// Legacy export - no longer used for chips, but kept for compatibility
export const CHIPS_PER_TOKEN = 100;

export function useTokenBalance(
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}` | undefined,
  decimals: number = STABLECOIN_DECIMALS
) {
  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress,
    },
  });

  const balance = data ? formatUnits(data, decimals) : '0';

  return {
    balance,
    rawBalance: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}

// Dedicated hook for WOVER balance (for chip purchases)
export function useWoverBalance(walletAddress: `0x${string}` | undefined) {
  return useTokenBalance(TOKEN_ADDRESSES.WOVER, walletAddress, WOVER_DECIMALS);
}

export function useTokenAllowance(
  tokenAddress: `0x${string}`,
  ownerAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}`
) {
  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  });

  return {
    allowance: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}
