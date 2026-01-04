import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useWalletContext } from '@/contexts/WalletContext';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, 
  Table2, 
  Settings, 
  Users, 
  Trophy,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Wallet,
  Crown,
  Lock,
  Copy,
  ExternalLink,
  FileCode
} from 'lucide-react';
import { TournamentManager } from '@/components/admin/TournamentManager';
import { UserManager } from '@/components/admin/UserManager';
import { PayoutManager } from '@/components/admin/PayoutManager';
import { useAdminOperations, MASTER_ADMIN_WALLET } from '@/hooks/useAdminOperations';

interface TableData {
  id: string;
  name: string;
  max_players: number;
  big_blind: number;
  small_blind: number;
  status: string;
  is_private: boolean;
  created_at: string;
}

interface PlatformConfig {
  id: string;
  value: unknown;
  updated_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { address, isConnected, isAdmin } = useWalletContext();
  const { isMasterAdmin, isLoading: isOperationLoading, updateConfig } = useAdminOperations(address);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Initial load delay to let WalletContext sync
  useEffect(() => {
    const timer = setTimeout(() => setProfileLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const [tables, setTables] = useState<TableData[]>([]);
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  // New table form
  const [newTableName, setNewTableName] = useState('');
  const [newTableMaxPlayers, setNewTableMaxPlayers] = useState(6);
  const [newTableBigBlind, setNewTableBigBlind] = useState(20);
  const [isCreatingTable, setIsCreatingTable] = useState(false);

  // Config editing
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configValue, setConfigValue] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (!profileLoading && (!isConnected || !isAdmin)) {
      toast.error('Access denied - Admin only');
      navigate('/');
    }
  }, [isAdmin, isConnected, profileLoading, navigate]);

  // Fetch tables
  const fetchTables = async () => {
    setIsLoadingTables(true);
    const { data, error } = await supabase
      .from('poker_tables')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load tables');
    } else {
      setTables(data || []);
    }
    setIsLoadingTables(false);
  };

  // Fetch configs
  const fetchConfigs = async () => {
    setIsLoadingConfigs(true);
    const { data, error } = await supabase
      .from('platform_config')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to load configs');
    } else {
      setConfigs(data || []);
    }
    setIsLoadingConfigs(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTables();
      fetchConfigs();
    }
  }, [isAdmin]);

  // Create new table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      toast.error('Table name is required');
      return;
    }

    setIsCreatingTable(true);
    const { error } = await supabase.from('poker_tables').insert({
      name: newTableName.trim(),
      max_players: newTableMaxPlayers,
      big_blind: newTableBigBlind,
      small_blind: Math.floor(newTableBigBlind / 2),
      status: 'waiting',
      current_phase: 'waiting',
    });

    if (error) {
      console.error('Error creating table:', error);
      toast.error('Failed to create table');
    } else {
      toast.success('Table created!');
      setNewTableName('');
      fetchTables();
    }
    setIsCreatingTable(false);
  };

  // Delete table
  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    const { error } = await supabase
      .from('poker_tables')
      .delete()
      .eq('id', tableId);

    if (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    } else {
      toast.success('Table deleted');
      fetchTables();
    }
  };

  // Update config - uses secure edge function
  const handleUpdateConfigSecure = async (configId: string) => {
    try {
      const parsedValue = JSON.parse(configValue);
      
      const result = await updateConfig(configId, parsedValue);
      
      if (result.success) {
        setEditingConfig(null);
        fetchConfigs();
      }
    } catch {
      toast.error('Invalid JSON format');
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage tables, configs, and users</p>
          </div>
          <Badge variant="destructive" className="ml-auto">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Admin Access
          </Badge>
        </div>

        <Tabs defaultValue="tables" className="space-y-6">
          <TabsList className="bg-card/50 border border-border/50 flex-wrap">
            <TabsTrigger value="tables" className="gap-2">
              <Table2 className="h-4 w-4" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-2">
              <Trophy className="h-4 w-4" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="payouts" className="gap-2">
              <Wallet className="h-4 w-4" />
              Payouts
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2">
              <Shield className="h-4 w-4" />
              Contracts
            </TabsTrigger>
          </TabsList>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6">
            {/* Create Table Form */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Table
                </CardTitle>
                <CardDescription>Create a public table (no fee)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTable} className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="tableName">Table Name</Label>
                    <Input
                      id="tableName"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      placeholder="High Stakes Room..."
                      className="bg-background/50"
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor="maxPlayers">Max Players</Label>
                    <Input
                      id="maxPlayers"
                      type="number"
                      min={2}
                      max={9}
                      value={newTableMaxPlayers}
                      onChange={(e) => setNewTableMaxPlayers(Number(e.target.value))}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor="bigBlind">Big Blind</Label>
                    <Input
                      id="bigBlind"
                      type="number"
                      min={2}
                      value={newTableBigBlind}
                      onChange={(e) => setNewTableBigBlind(Number(e.target.value))}
                      className="bg-background/50"
                    />
                  </div>
                  <Button type="submit" disabled={isCreatingTable}>
                    {isCreatingTable ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Table
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tables List */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">All Tables</CardTitle>
                  <CardDescription>{tables.length} tables total</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchTables}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingTables ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tables.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tables yet</p>
                ) : (
                  <div className="space-y-2">
                    {tables.map((table) => (
                      <div
                        key={table.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          <Table2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{table.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {table.max_players} players • {table.small_blind}/{table.big_blind} blinds
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={table.status === 'waiting' ? 'secondary' : 'default'}>
                            {table.status}
                          </Badge>
                          {table.is_private && (
                            <Badge variant="outline">Private</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTable(table.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-6">
            {/* Security Notice for non-master admins */}
            {!isMasterAdmin && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-500">Read-Only Access</p>
                      <p className="text-sm text-muted-foreground">
                        Only the Master Admin wallet can modify platform configuration. 
                        You can view but not edit these settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Platform Configuration
                  {isMasterAdmin && (
                    <Badge className="bg-amber-500/20 text-amber-400 text-xs ml-2">
                      <Crown className="h-3 w-3 mr-1" />
                      Editable
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Token addresses, fees, and platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingConfigs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {configs.map((config) => (
                      <div
                        key={config.id}
                        className="p-4 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-mono font-semibold text-sm text-primary">{config.id}</h4>
                          <span className="text-xs text-muted-foreground">
                            Updated: {new Date(config.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        {editingConfig === config.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={configValue}
                              onChange={(e) => setConfigValue(e.target.value)}
                              className="w-full h-32 p-2 rounded bg-background border border-border font-mono text-xs"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleUpdateConfigSecure(config.id)} disabled={isOperationLoading}>
                                {isOperationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingConfig(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <pre className="text-xs bg-muted/30 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(config.value, null, 2)}
                            </pre>
                            {isMasterAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => {
                                  setEditingConfig(config.id);
                                  setConfigValue(JSON.stringify(config.value, null, 2));
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments">
            <TournamentManager adminWallet={address || ''} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManager />
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <PayoutManager adminWallet={address || ''} />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
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
                  <h4 className="font-semibold text-foreground mb-3">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network:</span>
                      <span className="text-foreground font-mono">Over Protocol Mainnet (Chain ID: 54176)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract Status:</span>
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Pending Deploy</Badge>
                    </div>
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

                {/* Token Addresses with Copy */}
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <h4 className="font-semibold text-foreground mb-3">Token Addresses (Constructor Parameters)</h4>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'WOVER Token (_woverToken)', address: '0x59c914C8ac6F212bb655737CC80d9Abc79A1e273' },
                    ].map(({ label, address: addr }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-muted-foreground">{label}:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted/30 px-2 py-1 rounded font-mono">{addr}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(addr, label)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step Deployment Guide */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Step-by-Step Deployment Guide
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="p-3 rounded bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/20 text-primary">Step 1</Badge>
                        <span className="font-semibold">Open Remix IDE</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Go to <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          remix.ethereum.org <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-3 rounded bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/20 text-primary">Step 2</Badge>
                        <span className="font-semibold">Create Contract File</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        In Remix, create a new file <code className="bg-muted/30 px-1 rounded">PokerChipManager.sol</code>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Copy the contract code from: <code className="bg-muted/30 px-1 rounded">docs/contracts/PokerChipManager.sol</code>
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="p-3 rounded bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/20 text-primary">Step 3</Badge>
                        <span className="font-semibold">Compile Contract</span>
                      </div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Go to "Solidity Compiler" tab (left sidebar)</li>
                        <li>Select compiler version: <code className="bg-muted/30 px-1 rounded">0.8.19</code> or higher</li>
                        <li>Enable optimization (200 runs)</li>
                        <li>Click "Compile PokerChipManager.sol"</li>
                      </ul>
                    </div>

                    {/* Step 4 */}
                    <div className="p-3 rounded bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/20 text-primary">Step 4</Badge>
                        <span className="font-semibold">Connect MetaMask to Over Protocol</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Add Over Protocol network to MetaMask:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Network Name: <code className="bg-muted/30 px-1 rounded">Over Protocol</code></li>
                          <li>RPC URL: <code className="bg-muted/30 px-1 rounded">https://rpc.overprotocol.com/</code></li>
                          <li>Chain ID: <code className="bg-muted/30 px-1 rounded">54176</code></li>
                          <li>Currency Symbol: <code className="bg-muted/30 px-1 rounded">OVER</code></li>
                          <li>Explorer: <code className="bg-muted/30 px-1 rounded">https://explorer.overprotocol.com/</code></li>
                        </ul>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="p-3 rounded bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/20 text-primary">Step 5</Badge>
                        <span className="font-semibold">Deploy Contract</span>
                      </div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Go to "Deploy & Run" tab in Remix</li>
                        <li>Environment: <code className="bg-muted/30 px-1 rounded">Injected Provider - MetaMask</code></li>
                        <li>Select <code className="bg-muted/30 px-1 rounded">PokerChipManager</code> contract</li>
                        <li>Enter constructor parameter:
                          <ul className="list-none ml-4 mt-1">
                            <li className="flex items-center gap-2">
                              _woverToken: <code className="bg-muted/30 px-1 rounded text-xs">0x59c914C8ac6F212bb655737CC80d9Abc79A1e273</code>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5"
                                onClick={() => copyToClipboard('0x59c914C8ac6F212bb655737CC80d9Abc79A1e273', 'WOVER address')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </li>
                          </ul>
                        </li>
                        <li>Click "Deploy" and confirm in MetaMask</li>
                      </ul>
                    </div>

                    {/* Step 6 */}
                    <div className="p-3 rounded bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/20 text-primary">Step 6</Badge>
                        <span className="font-semibold">After Deployment</span>
                      </div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Copy the deployed contract address from Remix</li>
                        <li>Send me the contract address in chat</li>
                        <li>I will update the platform code with the new address</li>
                      </ul>
                    </div>
                  </div>
                </div>

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
                    <AlertTriangle className="h-4 w-4" />
                    Security Notice
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    The contract must be deployed from the Master Admin wallet: <code className="bg-muted/30 px-1 rounded text-xs">{MASTER_ADMIN_WALLET}</code>. 
                    This wallet will be the owner and the only one able to perform admin operations on the contract.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
