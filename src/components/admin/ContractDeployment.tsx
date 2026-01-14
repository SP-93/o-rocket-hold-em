import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContractDeploy } from '@/hooks/useContractDeploy';
import { useReadContract } from 'wagmi';
import { MASTER_ADMIN_WALLET } from '@/hooks/useAdminOperations';
import { 
  WOVER_TOKEN_ADDRESS, 
  POKER_CHIP_MANAGER_ABI,
  getStoredContractAddress,
  setStoredContractAddress,
} from '@/constants/pokerChipManagerContract';
import { overProtocol } from '@/config/wagmi';
import { toast } from 'sonner';
import { 
  FileCode,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Rocket,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface ContractDeploymentProps {
  isMasterAdmin: boolean;
  connectedAddress?: string;
}

export function ContractDeployment({ isMasterAdmin, connectedAddress }: ContractDeploymentProps) {
  const [storedAddress, setStoredAddressState] = useState<`0x${string}` | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  
  const { status, error, txHash, contractAddress, deploy, reset } = useContractDeploy();

  // Load stored address on mount
  useEffect(() => {
    const stored = getStoredContractAddress();
    setStoredAddressState(stored);
  }, []);

  // Update stored address when deployment succeeds
  useEffect(() => {
    if (status === 'success' && contractAddress) {
      setStoredAddressState(contractAddress);
    }
  }, [status, contractAddress]);

  // Read contract owner to verify deployment
  const { data: contractOwner, refetch: refetchOwner } = useReadContract({
    address: storedAddress || undefined,
    abi: POKER_CHIP_MANAGER_ABI,
    functionName: 'owner',
    chainId: overProtocol.id,
    query: {
      enabled: !!storedAddress,
    },
  });

  // Read WOVER token address from contract
  const { data: woverFromContract } = useReadContract({
    address: storedAddress || undefined,
    abi: POKER_CHIP_MANAGER_ABI,
    functionName: 'woverToken',
    chainId: overProtocol.id,
    query: {
      enabled: !!storedAddress,
    },
  });

  const isDeployed = !!storedAddress && !!contractOwner;
  const isOwnerCorrect = contractOwner?.toLowerCase() === MASTER_ADMIN_WALLET.toLowerCase();
  const isWoverCorrect = woverFromContract?.toLowerCase() === WOVER_TOKEN_ADDRESS.toLowerCase();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleManualAddressSave = () => {
    if (!manualAddress.startsWith('0x') || manualAddress.length !== 42) {
      toast.error('Invalid contract address format');
      return;
    }
    setStoredContractAddress(manualAddress as `0x${string}`);
    setStoredAddressState(manualAddress as `0x${string}`);
    setManualAddress('');
    toast.success('Contract address saved!');
    refetchOwner();
  };

  const getStatusBadge = () => {
    if (status === 'deploying' || status === 'confirming' || status === 'saving' || status === 'switching-network') {
      return (
        <Badge className="bg-blue-500/20 text-blue-400">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          {status === 'switching-network' ? 'Switching Network...' : 
           status === 'deploying' ? 'Awaiting Signature...' : 
           status === 'confirming' ? 'Confirming...' : 'Saving...'}
        </Badge>
      );
    }
    if (status === 'success' || isDeployed) {
      return (
        <Badge className="bg-green-500/20 text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Deployed
        </Badge>
      );
    }
    if (status === 'error') {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
        Pending Deploy
      </Badge>
    );
  };

  const isDeploying = status === 'deploying' || status === 'confirming' || status === 'saving' || status === 'switching-network';

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary" />
          Smart Contract Deployment
        </CardTitle>
        <CardDescription>Deploy and manage PokerChipManager contract on Over Protocol</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deployment Status */}
        <div className="p-4 rounded-lg bg-background/50 border border-border/30">
          <h4 className="font-semibold text-foreground mb-3">Contract Status</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Network:</span>
              <span className="text-foreground font-mono">Over Protocol Mainnet (Chain ID: 54176)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              {getStatusBadge()}
            </div>
            {(isDeployed || contractAddress) && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Contract Address:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-foreground font-mono text-xs bg-muted/30 px-2 py-1 rounded">
                      {(contractAddress || storedAddress)?.slice(0, 10)}...{(contractAddress || storedAddress)?.slice(-8)}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(contractAddress || storedAddress || '', 'Contract address')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <a 
                      href={`https://scan.over.network/address/${contractAddress || storedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Owner:</span>
                  <div className="flex items-center gap-2">
                    {isOwnerCorrect ? (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Admin Wallet ✓
                      </Badge>
                    ) : contractOwner ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Different Owner
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Loading...</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">WOVER Token:</span>
                  <div className="flex items-center gap-2">
                    {isWoverCorrect ? (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified ✓
                      </Badge>
                    ) : woverFromContract ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Mismatch
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Loading...</span>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Admin Wallet:</span>
              <div className="flex items-center gap-2">
                <code className="text-foreground font-mono text-xs">
                  {MASTER_ADMIN_WALLET.slice(0, 10)}...{MASTER_ADMIN_WALLET.slice(-8)}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(MASTER_ADMIN_WALLET, 'Admin wallet')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Deployment Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={reset}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Hash */}
        {txHash && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction:</span>
              <a 
                href={`https://scan.over.network/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center gap-1"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Deploy Button */}
        {!isDeployed && isMasterAdmin && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Deploy New Contract
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground mb-4">
                <p>Constructor Parameter:</p>
                <div className="flex items-center gap-2">
                  <code className="bg-muted/30 px-2 py-1 rounded text-xs">_woverToken: {WOVER_TOKEN_ADDRESS}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(WOVER_TOKEN_ADDRESS, 'WOVER address')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Button 
                onClick={deploy}
                disabled={isDeploying || connectedAddress?.toLowerCase() !== MASTER_ADMIN_WALLET.toLowerCase()}
                className="w-full"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {status === 'switching-network' ? 'Switching Network...' : 
                     status === 'deploying' ? 'Confirm in MetaMask...' : 
                     status === 'confirming' ? 'Confirming Transaction...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy Contract
                  </>
                )}
              </Button>
              {connectedAddress?.toLowerCase() !== MASTER_ADMIN_WALLET.toLowerCase() && (
                <p className="text-xs text-destructive mt-2">
                  Connect with Master Admin wallet to deploy
                </p>
              )}
            </div>

            {/* Manual Address Entry */}
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h4 className="font-semibold text-foreground mb-3">Already Deployed?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                If you deployed via Remix, enter the contract address here:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="0x..."
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button onClick={handleManualAddressSave} disabled={!manualAddress}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button for deployed contracts */}
        {isDeployed && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchOwner()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verify Contract
            </Button>
          </div>
        )}

        {/* Platform Constants */}
        <div className="p-4 rounded-lg bg-background/50 border border-border/30">
          <h4 className="font-semibold text-foreground mb-3">Platform Constants</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Chips per WOVER:</span>
              <span className="text-foreground font-bold">1 (1:1 ratio)</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Min Deposit:</span>
              <span className="text-foreground font-bold">0.01 WOVER</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Private Table Fee:</span>
              <span className="text-foreground font-bold">10 USDT/USDC</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Cash Game Rake:</span>
              <span className="text-foreground font-bold">2.5%</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Notice
          </h4>
          <p className="text-sm text-muted-foreground">
            The contract must be deployed from the Master Admin wallet: <code className="bg-muted/30 px-1 rounded text-xs">{MASTER_ADMIN_WALLET}</code>. 
            This wallet will be the owner and the only one able to perform admin operations on the contract.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
