import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  RefreshCw, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  ExternalLink,
  Copy
} from 'lucide-react';

interface PendingWithdrawal {
  id: string;
  wallet_address: string;
  chips_granted: number;
  wover_amount: number;
  tx_hash: string;
  created_at: string;
  processed: boolean;
  event_type: string;
}

interface PayoutManagerProps {
  adminWallet: string;
}

export function PayoutManager({ adminWallet }: PayoutManagerProps) {
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [txHashInput, setTxHashInput] = useState<Record<string, string>>({});

  // Fetch pending withdrawals
  const fetchWithdrawals = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('deposit_events')
      .select('*')
      .eq('event_type', 'withdrawal_pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } else {
      setWithdrawals(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-withdrawals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposit_events',
          filter: 'event_type=eq.withdrawal_pending'
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Process payout - mark as completed
  const handleProcessPayout = async (withdrawal: PendingWithdrawal) => {
    const txHash = txHashInput[withdrawal.id];
    if (!txHash?.trim()) {
      toast.error('Please enter the transaction hash');
      return;
    }

    setProcessingId(withdrawal.id);

    try {
      const { data, error } = await supabase.functions.invoke('chip-manager', {
        body: {
          action: 'admin_process_payout',
          depositId: withdrawal.id,
          txHash: txHash.trim(),
          adminWallet,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Payout processed successfully!');
      setTxHashInput(prev => ({ ...prev, [withdrawal.id]: '' }));
      fetchWithdrawals();
    } catch (err) {
      console.error('Error processing payout:', err);
      toast.error('Failed to process payout');
    } finally {
      setProcessingId(null);
    }
  };

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Calculate token amount from chips (100 chips = 1 USDT/USDC)
  const chipsToToken = (chips: number) => {
    return (chips / 100).toFixed(2);
  };

  const pendingWithdrawals = withdrawals.filter(w => !w.processed);
  const completedWithdrawals = withdrawals.filter(w => w.processed);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${chipsToToken(pendingWithdrawals.reduce((sum, w) => sum + w.chips_granted, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedWithdrawals.length}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Withdrawals */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Pending Withdrawals
            </CardTitle>
            <CardDescription>
              Review and process player withdrawal requests
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchWithdrawals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingWithdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending withdrawals</p>
              <p className="text-sm">All payouts are processed!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="p-4 rounded-lg bg-background/50 border border-amber-500/30"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Withdrawal Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                          Pending
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(withdrawal.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Wallet:</span>
                        <code className="text-sm font-mono bg-muted/30 px-2 py-0.5 rounded">
                          {formatAddress(withdrawal.wallet_address)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(withdrawal.wallet_address)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Chips: </span>
                          <span className="font-bold">{withdrawal.chips_granted.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Amount: </span>
                          <span className="font-bold text-green-500">
                            ${chipsToToken(withdrawal.chips_granted)} USDT/USDC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex flex-col gap-2 min-w-[280px]">
                      <Input
                        placeholder="Enter TX hash after sending..."
                        value={txHashInput[withdrawal.id] || ''}
                        onChange={(e) => setTxHashInput(prev => ({ 
                          ...prev, 
                          [withdrawal.id]: e.target.value 
                        }))}
                        className="bg-background/50 font-mono text-xs"
                      />
                      <Button
                        onClick={() => handleProcessPayout(withdrawal)}
                        disabled={processingId === withdrawal.id || !txHashInput[withdrawal.id]?.trim()}
                        className="w-full"
                      >
                        {processingId === withdrawal.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Mark as Paid
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Withdrawals */}
      {completedWithdrawals.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Recently Completed
            </CardTitle>
            <CardDescription>
              Last {Math.min(completedWithdrawals.length, 10)} processed payouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedWithdrawals.slice(0, 10).map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {formatAddress(withdrawal.wallet_address)}
                        </code>
                        <span className="text-sm font-medium">
                          ${chipsToToken(withdrawal.chips_granted)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {withdrawal.tx_hash && withdrawal.tx_hash !== 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://basescan.org/tx/${withdrawal.tx_hash}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
