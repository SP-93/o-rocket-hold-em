import { useState, useCallback } from 'react';
import { useWalletClient, usePublicClient, useSwitchChain, useChainId } from 'wagmi';
import { encodeAbiParameters, parseAbiParameters } from 'viem';
import { overProtocol } from '@/config/wagmi';
import { 
  POKER_CHIP_MANAGER_BYTECODE, 
  POKER_CHIP_MANAGER_ABI,
  WOVER_TOKEN_ADDRESS,
  setStoredContractAddress 
} from '@/constants/pokerChipManagerContract';
import { supabase } from '@/integrations/supabase/client';

export type DeploymentStatus = 'idle' | 'switching-network' | 'deploying' | 'confirming' | 'saving' | 'success' | 'error';

interface UseContractDeployReturn {
  status: DeploymentStatus;
  error: string | null;
  txHash: `0x${string}` | null;
  contractAddress: `0x${string}` | null;
  deploy: () => Promise<void>;
  reset: () => void;
}

export function useContractDeploy(): UseContractDeployReturn {
  const [status, setStatus] = useState<DeploymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [contractAddress, setContractAddress] = useState<`0x${string}` | null>(null);

  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
    setContractAddress(null);
  }, []);

  const deploy = useCallback(async () => {
    if (!walletClient) {
      setError('Wallet not connected');
      setStatus('error');
      return;
    }

    if (!publicClient) {
      setError('Public client not available');
      setStatus('error');
      return;
    }

    try {
      // Step 1: Check/switch to Over Protocol network
      if (chainId !== overProtocol.id) {
        setStatus('switching-network');
        console.log('[useContractDeploy] Switching to Over Protocol...');
        
        try {
          await switchChainAsync({ chainId: overProtocol.id });
        } catch (switchError) {
          console.error('[useContractDeploy] Network switch failed:', switchError);
          setError(`Please switch to Over Protocol network manually. Chain ID: ${overProtocol.id}`);
          setStatus('error');
          return;
        }
      }

      // Step 2: Encode constructor arguments
      setStatus('deploying');
      console.log('[useContractDeploy] Encoding constructor args with WOVER:', WOVER_TOKEN_ADDRESS);
      
      const constructorArgs = encodeAbiParameters(
        parseAbiParameters('address _woverToken'),
        [WOVER_TOKEN_ADDRESS]
      );

      // Combine bytecode with constructor arguments
      const deployData = `${POKER_CHIP_MANAGER_BYTECODE}${constructorArgs.slice(2)}` as `0x${string}`;

      console.log('[useContractDeploy] Deploying contract...');

      // Step 3: Deploy contract - use null 'to' for contract deployment
      const hash = await walletClient.sendTransaction({
        to: undefined, // Contract creation
        data: deployData,
        chain: overProtocol,
        account: walletClient.account,
      } as any);

      setTxHash(hash);
      console.log('[useContractDeploy] Transaction sent:', hash);

      // Step 4: Wait for confirmation
      setStatus('confirming');
      console.log('[useContractDeploy] Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
      });

      if (!receipt.contractAddress) {
        throw new Error('Contract address not found in receipt');
      }

      const deployedAddress = receipt.contractAddress as `0x${string}`;
      setContractAddress(deployedAddress);
      console.log('[useContractDeploy] Contract deployed at:', deployedAddress);

      // Step 5: Save to local storage and database
      setStatus('saving');
      setStoredContractAddress(deployedAddress);

      // Save to platform_config
      try {
        const { error: dbError } = await supabase.functions.invoke('chip-manager', {
          body: {
            action: 'update_contract_address',
            contract_address: deployedAddress,
          },
        });

        if (dbError) {
          console.warn('[useContractDeploy] Failed to save to database:', dbError);
          // Don't fail the deployment for this
        }
      } catch (saveError) {
        console.warn('[useContractDeploy] Database save error:', saveError);
      }

      setStatus('success');
      console.log('[useContractDeploy] Deployment complete!');

    } catch (err) {
      console.error('[useContractDeploy] Deployment error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          setError('Transaction was rejected by user');
        } else if (err.message.includes('insufficient funds')) {
          setError('Insufficient OVER for gas fees');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unknown error occurred during deployment');
      }
      
      setStatus('error');
    }
  }, [walletClient, publicClient, chainId, switchChainAsync]);

  return {
    status,
    error,
    txHash,
    contractAddress,
    deploy,
    reset,
  };
}
