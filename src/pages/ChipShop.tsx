import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { useWalletContext } from '@/contexts/WalletContext';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChipBalance } from '@/hooks/useChipBalance';
import { useWoverBalance, TOKEN_ADDRESSES, ADMIN_WALLET, WOVER_DECIMALS } from '@/hooks/useTokenBalance';
import { usePokerChipManager } from '@/hooks/usePokerChipManager';
import { getStoredContractAddress } from '@/constants/pokerChipManagerContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, ArrowDownToLine, ArrowUpFromLine, Wallet, RefreshCw, Info, CircleDollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { parseUnits } from 'viem';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { overProtocol } from '@/config/wagmi';

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

export default function ChipShop() {
  const { t } = useTranslation();
  const { address, isConnected, openConnectModal } = useWalletContext();
  const { balance: chipBalance, isLoading: chipsLoading, refetch: refetchChips } = useChipBalance();
  
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // WOVER balance for chip purchases (1 WOVER = 1 CHIP)
  const { balance: woverBalance, isLoading: woverLoading, refetch: refetchWover } = useWoverBalance(
    address as `0x${string}` | undefined
  );

  // Smart contract integration
  const { 
    isContractDeployed,
    playerChips: onChainChips,
    buyIn: contractBuyIn,
    cashOut: contractCashOut,
    isPending: isContractPending,
    isConfirming: isContractConfirming,
    isSuccess: isContractSuccess,
    refetchAll: refetchContract
  } = usePokerChipManager(address as `0x${string}` | undefined);

  // Sync on-chain balance to database after successful contract transaction
  useEffect(() => {
    const syncBalance = async () => {
      if (isContractSuccess && address && isContractDeployed) {
        try {
          // Give time for on-chain state to update
          await new Promise(resolve => setTimeout(resolve, 2000));
          refetchContract();
          
          // Sync to database
          await supabase.functions.invoke('chip-manager', {
            body: {
              action: 'sync_balance',
              walletAddress: address.toLowerCase(),
              onChainChips: parseFloat(onChainChips),
            },
          });
          
          refetchChips();
          toast.success(t('chipShop.balanceSynced') || 'Balance synced successfully!');
        } catch (error) {
          console.error('Sync error:', error);
        }
      }
    };
    
    syncBalance();
  }, [isContractSuccess]);

  // Write contract for WOVER transfer (legacy method when contract not deployed)
  const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // 1 WOVER = 1 CHIP
  const chipsFromDeposit = depositAmount ? parseFloat(depositAmount) : 0;
  const woverFromWithdraw = withdrawAmount ? parseFloat(withdrawAmount) : 0;

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error(t('chipShop.enterAmount'));
      return;
    }

    if (parseFloat(depositAmount) > parseFloat(woverBalance)) {
      toast.error(t('errors.insufficientBalance'));
      return;
    }

    try {
      if (isContractDeployed) {
        // Use smart contract for deposits
        await contractBuyIn(depositAmount);
        toast.success(t('chipShop.depositPending'));
      } else {
        // Legacy method: transfer to admin wallet
        const amountWei = parseUnits(depositAmount, WOVER_DECIMALS);
        
        writeContract({
          address: TOKEN_ADDRESSES.WOVER,
          abi: ERC20_TRANSFER_ABI,
          functionName: 'transfer',
          args: [ADMIN_WALLET, amountWei],
          chain: overProtocol,
          account: address as `0x${string}`,
        });

        toast.success(t('chipShop.depositPending'));
      }
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error(t('errors.transactionFailed'));
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error(t('chipShop.enterAmount'));
      return;
    }

    if (chipBalance && parseFloat(withdrawAmount) > chipBalance.availableChips) {
      toast.error(t('errors.insufficientBalance'));
      return;
    }

    try {
      if (isContractDeployed) {
        // Use smart contract for withdrawals - direct on-chain cashout
        await contractCashOut(withdrawAmount);
        toast.success(t('chipShop.withdrawProcessing'));
        setWithdrawAmount('');
      } else {
        // Legacy method: use edge function
        const { data, error } = await supabase.functions.invoke('process-withdrawal', {
          body: {
            wallet_address: address,
            chip_amount: parseFloat(withdrawAmount),
          },
        });

        if (error) throw error;

        toast.success(t('chipShop.withdrawQueued'));
        setWithdrawAmount('');
        refetchChips();
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(t('errors.withdrawalFailed'));
    }
  };

  const refreshBalances = () => {
    refetchChips();
    refetchWover();
    if (isContractDeployed) {
      refetchContract();
    }
    toast.success(t('chipShop.balancesRefreshed'));
  };

  // Combined pending state
  const isAnyPending = isTxPending || isContractPending || isConfirming || isContractConfirming;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Wallet className="w-12 h-12 mx-auto text-primary mb-4" />
              <CardTitle>{t('errors.connectWallet')}</CardTitle>
              <CardDescription>{t('errors.connectWalletDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={openConnectModal} className="w-full">
                {t('common.connectWallet')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Coins className="w-8 h-8 text-poker-gold" />
                {t('chipShop.title')}
              </h1>
              <p className="text-muted-foreground mt-1">{t('chipShop.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshBalances}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('chipShop.refresh')}
              </Button>
              <Link to="/lobby">
                <Button variant="secondary" size="sm">
                  {t('table.backToLobby')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Balance Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-poker-gold/20 to-poker-gold/5 border-poker-gold/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('chipShop.availableChips')}</p>
                    <p className="text-3xl font-bold text-poker-gold">
                      {chipsLoading ? '...' : (
                        isContractDeployed 
                          ? parseFloat(onChainChips).toLocaleString(undefined, { maximumFractionDigits: 4 })
                          : chipBalance?.availableChips.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? 0
                      )}
                    </p>
                    {isContractDeployed && (
                      <p className="text-xs text-muted-foreground mt-1">{t('chipShop.onChainBalance') || 'On-chain balance'}</p>
                    )}
                  </div>
                  <Coins className="w-10 h-10 text-poker-gold/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('chipShop.lockedInGames')}</p>
                    <p className="text-3xl font-bold text-primary">
                      {chipsLoading ? '...' : chipBalance?.lockedInGames.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? 0}
                    </p>
                  </div>
                  <CircleDollarSign className="w-10 h-10 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">WOVER {t('common.balance')}</p>
                    <p className="text-3xl font-bold font-mono">
                      {woverLoading ? '...' : parseFloat(woverBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>
                  <CircleDollarSign className="w-10 h-10 text-muted-foreground/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deposit/Withdraw Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>{t('chipShop.exchange')}</CardTitle>
              <CardDescription>{t('chipShop.exchangeDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit" className="gap-2">
                    <ArrowDownToLine className="w-4 h-4" />
                    {t('chipShop.deposit')}
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="gap-2">
                    <ArrowUpFromLine className="w-4 h-4" />
                    {t('chipShop.withdraw')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="space-y-6">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{t('chipShop.amount')} (WOVER)</label>
                      <span className="text-xs text-muted-foreground">
                        {t('chipShop.balance')}: {parseFloat(woverBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} WOVER
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="0"
                        step="0.0001"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setDepositAmount(woverBalance)}
                      >
                        {t('common.max')}
                      </Button>
                    </div>
                  </div>

                  {/* Conversion Preview */}
                  {depositAmount && parseFloat(depositAmount) > 0 && (
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('chipShop.youWillReceive')}</span>
                        <span className="font-bold text-poker-gold text-lg">
                          {chipsFromDeposit.toLocaleString(undefined, { maximumFractionDigits: 4 })} {t('common.chips')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        1 WOVER = 1 CHIP
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleDeposit}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isAnyPending}
                    className="w-full"
                    size="lg"
                  >
                    {isTxPending || isConfirming ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {t('chipShop.processing')}
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-4 h-4 mr-2" />
                        {t('chipShop.depositTokens', { token: 'WOVER' })}
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-6">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{t('chipShop.chipsAmount')}</label>
                      <span className="text-xs text-muted-foreground">
                        {t('chips.available')}: {chipBalance?.availableChips.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? 0}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="0"
                        step="0.0001"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setWithdrawAmount(String(chipBalance?.availableChips ?? 0))}
                      >
                        {t('common.max')}
                      </Button>
                    </div>
                  </div>

                  {/* Conversion Preview */}
                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('chipShop.youWillReceive')}</span>
                        <span className="font-bold text-primary text-lg">
                          {woverFromWithdraw.toLocaleString(undefined, { maximumFractionDigits: 4 })} WOVER
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        1 CHIP = 1 WOVER
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full"
                    size="lg"
                    variant="secondary"
                  >
                    <ArrowUpFromLine className="w-4 h-4 mr-2" />
                    {t('chipShop.withdrawChips')}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="bg-secondary/30">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{t('chipShop.infoLine1')}</p>
                  <p>{t('chipShop.infoLine2')}</p>
                  <p>{t('chipShop.infoLine3')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
