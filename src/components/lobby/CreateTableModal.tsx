import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Lock, Users, Eye, EyeOff, Info } from 'lucide-react';
import { useWalletContext } from '@/contexts/WalletContext';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { TOKEN_ADDRESSES, ADMIN_WALLET, TOKEN_DECIMALS } from '@/hooks/useTokenBalance';
import { overProtocol } from '@/config/wagmi';
import { supabase } from '@/integrations/supabase/client';

interface CreateTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTable: (
    name: string, 
    maxPlayers: 5 | 6, 
    smallBlind: number, 
    bigBlind: number,
    isPrivate?: boolean,
    password?: string,
    allowedPlayers?: string[],
    creatorWallet?: string,
    creationFeeTx?: string,
    creationFeeToken?: string
  ) => Promise<string | null>;
}

const blindOptions = [
  // Micro-stakes for when WOVER price increases
  { small: 0.01, big: 0.02, label: '0.01/0.02' },
  { small: 0.05, big: 0.1, label: '0.05/0.1' },
  { small: 0.1, big: 0.2, label: '0.1/0.2' },
  { small: 0.5, big: 1, label: '0.5/1' },
  // Standard stakes
  { small: 1, big: 2, label: '1/2' },
  { small: 2, big: 5, label: '2/5' },
  { small: 5, big: 10, label: '5/10' },
  { small: 10, big: 20, label: '10/20' },
  { small: 25, big: 50, label: '25/50' },
  { small: 50, big: 100, label: '50/100' },
  { small: 100, big: 200, label: '100/200' },
];

// ERC20 Transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

type TokenType = 'USDT' | 'USDC';

export function CreateTableModal({ open, onOpenChange, onCreateTable }: CreateTableModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { address } = useWalletContext();
  
  const [tableName, setTableName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<'5' | '6'>('6');
  const [selectedBlinds, setSelectedBlinds] = useState('1/2');
  const [isCreating, setIsCreating] = useState(false);
  
  // Private table options
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteWallets, setInviteWallets] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenType>('USDT');
  const [privateTableFee, setPrivateTableFee] = useState(10);
  
  // Transaction state
  const { writeContract, data: txHash, isPending: isTxPending, reset: resetTx } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Fetch platform config for private table fee
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('platform_config')
        .select('value')
        .eq('id', 'private_table_fee')
        .maybeSingle();
      
      if (data?.value && typeof data.value === 'object' && 'amount' in data.value) {
        setPrivateTableFee((data.value as { amount: number }).amount);
      }
    };
    fetchConfig();
  }, []);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      // Transaction confirmed, create the table
      handleCreateAfterPayment(txHash);
    }
  }, [isConfirmed, txHash]);

  const handleCreateAfterPayment = async (txHash: string) => {
    const blindOption = blindOptions.find(b => b.label === selectedBlinds) || blindOptions[1];
    const allowedPlayers = inviteWallets
      .split(',')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);
    
    // Add creator to allowed players
    if (address && !allowedPlayers.includes(address.toLowerCase())) {
      allowedPlayers.push(address.toLowerCase());
    }

    const tableId = await onCreateTable(
      tableName,
      parseInt(maxPlayers) as 5 | 6,
      blindOption.small,
      blindOption.big,
      true,
      password,
      allowedPlayers,
      address || undefined,
      txHash,
      selectedToken
    );

    if (tableId) {
      toast({
        title: t('lobby.tableCreated'),
        description: t('lobby.privateTableReady', { name: tableName }),
      });
      resetForm();
      onOpenChange(false);
      navigate(`/table/${tableId}`);
    } else {
      toast({
        title: t('common.error'),
        description: t('lobby.createFailed'),
        variant: 'destructive',
      });
    }
    setIsCreating(false);
  };

  const resetForm = () => {
    setTableName('');
    setIsPrivate(false);
    setPassword('');
    setInviteWallets('');
    resetTx();
  };

  const handleCreate = async () => {
    if (!tableName.trim()) {
      toast({
        title: t('common.error'),
        description: t('lobby.enterTableName'),
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    if (isPrivate) {
      // Need to pay fee first
      if (!address) {
        toast({
          title: t('common.error'),
          description: t('errors.walletNotConnected'),
          variant: 'destructive',
        });
        setIsCreating(false);
        return;
      }

      try {
        const amountWei = parseUnits(String(privateTableFee), TOKEN_DECIMALS);
        
        writeContract({
          address: TOKEN_ADDRESSES[selectedToken],
          abi: ERC20_TRANSFER_ABI,
          functionName: 'transfer',
          args: [ADMIN_WALLET, amountWei],
          chain: overProtocol,
          account: address as `0x${string}`,
        });
      } catch (error) {
        console.error('Payment error:', error);
        toast({
          title: t('common.error'),
          description: t('errors.transactionFailed'),
          variant: 'destructive',
        });
        setIsCreating(false);
      }
    } else {
      // Public table - no payment needed
      const blindOption = blindOptions.find(b => b.label === selectedBlinds) || blindOptions[1];
      const tableId = await onCreateTable(
        tableName,
        parseInt(maxPlayers) as 5 | 6,
        blindOption.small,
        blindOption.big
      );

      if (tableId) {
        toast({
          title: t('lobby.tableCreated'),
          description: t('lobby.tableReady', { name: tableName }),
        });
        resetForm();
        onOpenChange(false);
        navigate(`/table/${tableId}`);
      } else {
        toast({
          title: t('common.error'),
          description: t('lobby.createFailed'),
          variant: 'destructive',
        });
      }
      setIsCreating(false);
    }
  };

  const isProcessing = isCreating || isTxPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {t('lobby.createTable')}
          </DialogTitle>
          <DialogDescription>
            {t('lobby.setupDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="tableName">{t('lobby.tableName')}</Label>
            <Input
              id="tableName"
              placeholder={t('lobby.tableNamePlaceholder')}
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="font-body"
            />
          </div>

          {/* Max Players */}
          <div className="space-y-3">
            <Label>{t('lobby.numberOfPlayers')}</Label>
            <RadioGroup
              value={maxPlayers}
              onValueChange={(value) => setMaxPlayers(value as '5' | '6')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5" id="players-5" />
                <Label htmlFor="players-5" className="cursor-pointer">
                  5 {t('common.players')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6" id="players-6" />
                <Label htmlFor="players-6" className="cursor-pointer">
                  6 {t('common.players')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Blinds */}
          <div className="space-y-3">
            <Label>{t('lobby.blinds')} (CHIP)</Label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {blindOptions.map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant={selectedBlinds === option.label ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedBlinds(option.label)}
                  className="font-mono text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Private Table Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">{t('lobby.privateTable')}</p>
                <p className="text-xs text-muted-foreground">{t('lobby.privateTableDesc')}</p>
              </div>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          {/* Private Table Options */}
          {isPrivate && (
            <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('lobby.tablePassword')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('lobby.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Invite Wallets */}
              <div className="space-y-2">
                <Label htmlFor="inviteWallets" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('lobby.invitePlayers')}
                </Label>
                <Input
                  id="inviteWallets"
                  placeholder={t('lobby.invitePlaceholder')}
                  value={inviteWallets}
                  onChange={(e) => setInviteWallets(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t('lobby.inviteHint')}</p>
              </div>

              {/* Fee Payment */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {t('lobby.creationFee')}
                </Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={selectedToken === 'USDT' ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => setSelectedToken('USDT')}
                  >
                    USDT
                  </Badge>
                  <Badge
                    variant={selectedToken === 'USDC' ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => setSelectedToken('USDC')}
                  >
                    USDC
                  </Badge>
                  <span className="ml-auto font-bold text-poker-gold">
                    {privateTableFee} {selectedToken}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isProcessing}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isProcessing}
            className="glow-primary"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTxPending || isConfirming 
              ? t('lobby.processingPayment')
              : isPrivate 
                ? t('lobby.payAndCreate', { amount: privateTableFee, token: selectedToken })
                : t('lobby.createTable')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
