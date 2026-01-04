import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Loader2, 
  RefreshCw, 
  Search,
  Shield,
  Coins,
  UserPlus,
  UserMinus,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { useWalletContext } from '@/contexts/WalletContext';
import { useAdminOperations, MASTER_ADMIN_WALLET } from '@/hooks/useAdminOperations';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface PlayerProfile {
  id: string;
  wallet_address: string;
  username: string;
  avatar_url: string | null;
  created_at: string | null;
}

interface PlayerBalance {
  wallet_address: string;
  available_chips: number;
  locked_in_games: number;
  total_deposited_wover: number;
  total_withdrawn_wover: number;
}

interface UserRole {
  id: string;
  wallet_address: string;
  role: AppRole;
}

interface CombinedUser {
  profile: PlayerProfile;
  balance?: PlayerBalance;
  role?: UserRole;
}

export function UserManager() {
  const { address } = useWalletContext();
  const { isMasterAdmin, isLoading: isOperationLoading, addAdmin, updateRole, removeAdmin } = useAdminOperations(address);
  
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAdminWallet, setNewAdminWallet] = useState('');

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('player_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast.error('Failed to load users');
      setIsLoading(false);
      return;
    }

    // Fetch balances
    const { data: balances } = await supabase
      .from('player_balances')
      .select('*');

    // Fetch roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*');

    setRoles(rolesData || []);

    // Combine data
    const combined: CombinedUser[] = (profiles || []).map(profile => ({
      profile,
      balance: (balances || []).find(b => b.wallet_address === profile.wallet_address),
      role: (rolesData || []).find(r => r.wallet_address === profile.wallet_address),
    }));

    setUsers(combined);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminWallet.trim() || !newAdminWallet.startsWith('0x')) {
      toast.error('Please enter a valid wallet address');
      return;
    }

    // Check if already exists
    const walletLower = newAdminWallet.toLowerCase();
    const existing = roles.find(r => r.wallet_address === walletLower);
    if (existing) {
      toast.error('User already has a role assigned');
      return;
    }

    const result = await addAdmin(newAdminWallet);
    if (result.success) {
      setNewAdminWallet('');
      fetchData();
    }
  };

  const handleUpdateRole = async (walletAddress: string, newRole: AppRole | 'remove') => {
    if (newRole === 'remove') {
      const result = await removeAdmin(walletAddress);
      if (result.success) {
        fetchData();
      }
    } else {
      const result = await updateRole(walletAddress, newRole);
      if (result.success) {
        fetchData();
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.profile.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role?: AppRole, walletAddress?: string) => {
    const isMaster = walletAddress?.toLowerCase() === MASTER_ADMIN_WALLET;
    
    if (isMaster) {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Master Admin
        </Badge>
      );
    }
    
    if (!role) return null;
    const colors = {
      admin: 'bg-destructive/20 text-destructive border-destructive/30',
      moderator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      user: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return (
      <Badge className={colors[role]}>
        <Shield className="h-3 w-3 mr-1" />
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      {!isMasterAdmin && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-500">Limited Admin Access</p>
                <p className="text-sm text-muted-foreground">
                  Only the Master Admin wallet can add new administrators. 
                  You can manage moderator and user roles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Admin - Only visible to Master Admin */}
      {isMasterAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Add Admin
              <Badge className="ml-2 bg-amber-500/20 text-amber-400 text-xs">Master Admin Only</Badge>
            </CardTitle>
            <CardDescription>
              Grant admin privileges to a wallet address. This action can only be performed by the Master Admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newAdminWallet}
                onChange={(e) => setNewAdminWallet(e.target.value)}
                placeholder="0x..."
                className="bg-background/50 font-mono"
              />
              <Button onClick={handleAddAdmin} disabled={isOperationLoading}>
                {isOperationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Add Admin
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </CardTitle>
            <CardDescription>{users.length} registered users</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 w-64 bg-background/50"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'No users match your search' : 'No users registered yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(({ profile, balance, role }) => {
                const isMaster = profile.wallet_address.toLowerCase() === MASTER_ADMIN_WALLET;
                const isAdmin = role?.role === 'admin';
                // Only Master Admin can change admin roles
                const canChangeRole = isMasterAdmin || (!isAdmin && role?.role !== 'admin');
                
                return (
                  <div
                    key={profile.id}
                    className={`p-4 rounded-lg border ${isMaster ? 'bg-amber-500/5 border-amber-500/20' : 'bg-background/50 border-border/30'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isMaster ? 'bg-amber-500/20' : 'bg-primary/20'}`}>
                          <span className={`text-sm font-bold ${isMaster ? 'text-amber-500' : 'text-primary'}`}>
                            {profile.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{profile.username}</h4>
                            {getRoleBadge(role?.role, profile.wallet_address)}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {balance && (
                          <div className="text-right text-sm">
                            <div className="flex items-center gap-1 text-poker-gold">
                              <Coins className="h-4 w-4" />
                              <span>{balance.available_chips.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {balance.locked_in_games.toLocaleString()} locked
                            </p>
                          </div>
                        )}

                        {/* Don't allow changing Master Admin's role */}
                        {isMaster ? (
                          <Badge variant="outline" className="w-32 justify-center text-amber-500 border-amber-500/30">
                            Protected
                          </Badge>
                        ) : (
                          <Select
                            value={role?.role || 'none'}
                            onValueChange={(value) => handleUpdateRole(
                              profile.wallet_address, 
                              value === 'none' ? 'remove' : value as AppRole
                            )}
                            disabled={!canChangeRole && !isMasterAdmin}
                          >
                            <SelectTrigger className="w-32 bg-background/50">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="flex items-center gap-1">
                                  <UserMinus className="h-3 w-3" />
                                  No Role
                                </span>
                              </SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              {isMasterAdmin && (
                                <SelectItem value="admin">Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
