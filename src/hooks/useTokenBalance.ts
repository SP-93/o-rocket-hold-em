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
  USDT: '0xA510432E4aa60B4acd476fb850EC84B7EE226b2d' as `0x${string}`,
  USDC: '0x8712796136Ac8e0EEeC123251ef93702f265aa80' as `0x${string}`,
} as const;

// Admin wallet for receiving payments
export const ADMIN_WALLET = '0x8334966329b7f4b459633696A8CA59118253bC89' as `0x${string}`;

// Token decimals (both are 6)
export const TOKEN_DECIMALS = 6;

// Chips per token (1 USDT/USDC = 100 chips)
export const CHIPS_PER_TOKEN = 100;

export function useTokenBalance(
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}` | undefined
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

  const balance = data ? formatUnits(data, TOKEN_DECIMALS) : '0';

  return {
    balance,
    rawBalance: data ?? BigInt(0),
    isLoading,
    refetch,
  };
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
