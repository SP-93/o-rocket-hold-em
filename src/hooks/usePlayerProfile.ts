import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlayerProfile {
  id: string;
  wallet_address: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePlayerProfileResult {
  profile: PlayerProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  needsUsername: boolean;
  createProfile: (username: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<PlayerProfile>) => Promise<{ success: boolean; error?: string }>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
}

export function usePlayerProfile(walletAddress: string | null): UsePlayerProfileResult {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);

  // Fetch profile when wallet changes
  useEffect(() => {
    if (!walletAddress) {
      setProfile(null);
      setIsAdmin(false);
      setNeedsUsername(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const normalizedAddress = walletAddress.toLowerCase();

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('player_profiles')
          .select('*')
          .eq('wallet_address', normalizedAddress)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (profileData) {
          setProfile(profileData);
          setNeedsUsername(false);
        } else {
          setProfile(null);
          setNeedsUsername(true);
        }

        // Check admin role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('wallet_address', normalizedAddress)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('[Admin Check] Wallet:', normalizedAddress);
        console.log('[Admin Check] Role query result:', roleData, roleError);
        console.log('[Admin Check] isAdmin:', !!roleData);
        
        setIsAdmin(!!roleData);
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [walletAddress]);

  const checkUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return false;

    const { data, error } = await supabase
      .from('player_profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return false;
    }

    return !data;
  }, []);

  const createProfile = useCallback(async (username: string): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress) {
      return { success: false, error: 'No wallet connected' };
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      return { success: false, error: 'Username must be 3-20 characters' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
    }

    // Check if available
    const isAvailable = await checkUsernameAvailable(username);
    if (!isAvailable) {
      return { success: false, error: 'Username is already taken' };
    }

    const normalizedAddress = walletAddress.toLowerCase();

    const { data, error } = await supabase
      .from('player_profiles')
      .insert({
        wallet_address: normalizedAddress,
        username: username.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      if (error.code === '23505') {
        return { success: false, error: 'Username is already taken' };
      }
      return { success: false, error: error.message };
    }

    setProfile(data);
    setNeedsUsername(false);
    return { success: true };
  }, [walletAddress, checkUsernameAvailable]);

  const updateProfile = useCallback(async (updates: Partial<PlayerProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress || !profile) {
      return { success: false, error: 'No profile to update' };
    }

    const { data, error } = await supabase
      .from('player_profiles')
      .update(updates)
      .eq('wallet_address', walletAddress.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    setProfile(data);
    return { success: true };
  }, [walletAddress, profile]);

  return {
    profile,
    isLoading,
    isAdmin,
    needsUsername,
    createProfile,
    updateProfile,
    checkUsernameAvailable,
  };
}
