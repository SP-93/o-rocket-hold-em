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
  UserMinus
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAdminWallet, setNewAdminWallet] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

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

    setIsAddingAdmin(true);

    const walletLower = newAdminWallet.toLowerCase();

    // Check if already exists
    const existing = roles.find(r => r.wallet_address === walletLower);
    if (existing) {
      toast.error('User already has a role assigned');
      setIsAddingAdmin(false);
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({
        wallet_address: walletLower,
        role: 'admin' as AppRole,
      });

    if (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add admin');
    } else {
      toast.success('Admin role added');
      setNewAdminWallet('');
      fetchData();
    }
    setIsAddingAdmin(false);
  };

  const handleUpdateRole = async (walletAddress: string, newRole: AppRole | 'remove') => {
    const walletLower = walletAddress.toLowerCase();

    if (newRole === 'remove') {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('wallet_address', walletLower);

      if (error) {
        toast.error('Failed to remove role');
      } else {
        toast.success('Role removed');
        fetchData();
      }
    } else {
      const existing = roles.find(r => r.wallet_address === walletLower);

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('wallet_address', walletLower);

        if (error) {
          toast.error('Failed to update role');
        } else {
          toast.success('Role updated');
          fetchData();
        }
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ wallet_address: walletLower, role: newRole });

        if (error) {
          toast.error('Failed to add role');
        } else {
          toast.success('Role added');
          fetchData();
        }
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.profile.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role?: AppRole) => {
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
      {/* Add Admin */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Admin
          </CardTitle>
          <CardDescription>Grant admin privileges to a wallet address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newAdminWallet}
              onChange={(e) => setNewAdminWallet(e.target.value)}
              placeholder="0x..."
              className="bg-background/50 font-mono"
            />
            <Button onClick={handleAddAdmin} disabled={isAddingAdmin}>
              {isAddingAdmin ? (
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
              {filteredUsers.map(({ profile, balance, role }) => (
                <div
                  key={profile.id}
                  className="p-4 rounded-lg bg-background/50 border border-border/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {profile.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{profile.username}</h4>
                          {getRoleBadge(role?.role)}
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

                      <Select
                        value={role?.role || 'none'}
                        onValueChange={(value) => handleUpdateRole(
                          profile.wallet_address, 
                          value === 'none' ? 'remove' : value as AppRole
                        )}
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
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
