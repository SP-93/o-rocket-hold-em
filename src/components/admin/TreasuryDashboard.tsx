import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  RefreshCw, 
  Coins, 
  TrendingUp, 
  Gift,
  Lock,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface TreasuryTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  source_wallet: string | null;
  table_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface TreasurySummary {
  total_house_edge: number;
  total_tips: number;
  total_private_fees: number;
  total_all: number;
}

export function TreasuryDashboard() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [summary, setSummary] = useState<TreasurySummary>({
    total_house_edge: 0,
    total_tips: 0,
    total_private_fees: 0,
    total_all: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Using any because treasury_transactions is a new table not yet in types.ts
      let query = (supabase as any)
        .from('treasury_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('transaction_type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching treasury:', error);
        return;
      }

      setTransactions((data as TreasuryTransaction[]) || []);

      // Calculate summary
      const allData = await (supabase as any)
        .from('treasury_transactions')
        .select('transaction_type, amount');

      if (allData.data) {
        const totals = (allData.data as any[]).reduce(
          (acc: TreasurySummary, tx: any) => {
            const amount = Number(tx.amount) || 0;
            acc.total_all += amount;
            if (tx.transaction_type === 'house_edge') acc.total_house_edge += amount;
            if (tx.transaction_type === 'tip') acc.total_tips += amount;
            if (tx.transaction_type === 'private_table_fee') acc.total_private_fees += amount;
            return acc;
          },
          { total_house_edge: 0, total_tips: 0, total_private_fees: 0, total_all: 0 }
        );
        setSummary(totals);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'house_edge':
        return <Percent className="h-4 w-4 text-emerald-500" />;
      case 'tip':
        return <Gift className="h-4 w-4 text-poker-gold" />;
      case 'private_table_fee':
        return <Lock className="h-4 w-4 text-primary" />;
      default:
        return <Coins className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'house_edge':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'tip':
        return 'bg-poker-gold/10 text-poker-gold border-poker-gold/20';
      case 'private_table_fee':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-poker-gold">{formatAmount(summary.total_all)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-poker-gold/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-poker-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">House Edge (0.1%)</p>
                <p className="text-2xl font-bold text-emerald-500">{formatAmount(summary.total_house_edge)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tips Logged</p>
                <p className="text-2xl font-bold text-primary">{formatAmount(summary.total_tips)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Private Table Fees</p>
                <p className="text-2xl font-bold text-muted-foreground">{formatAmount(summary.total_private_fees)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Treasury Transactions
            </CardTitle>
            <CardDescription>Revenue from house edge, tips, and fees</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={setFilter} className="mb-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="house_edge">House Edge</TabsTrigger>
              <TabsTrigger value="tip">Tips</TabsTrigger>
              <TabsTrigger value="private_table_fee">Private Fees</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getTransactionColor(tx.transaction_type)}>
                          {tx.transaction_type.replace(/_/g, ' ')}
                        </Badge>
                        {tx.table_id && (
                          <span className="text-xs text-muted-foreground font-mono">
                            Table: {tx.table_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      {tx.source_wallet && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          From: {tx.source_wallet.slice(0, 6)}...{tx.source_wallet.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-poker-gold flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +{formatAmount(tx.amount)} {tx.currency}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
