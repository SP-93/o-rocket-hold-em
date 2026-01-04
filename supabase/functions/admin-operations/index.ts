import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wallet-address',
};

// CRITICAL SECURITY: Only this wallet can add/remove admins and modify config
// This is the MASTER ADMIN wallet - hardcoded for security
const MASTER_ADMIN_WALLET = '0x8334966329b7f4b459633696a8ca59118253bc89';

// Get Supabase client with service role (for bypassing RLS)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AdminOperationRequest {
  operation: 'add_admin' | 'remove_admin' | 'update_role' | 'update_config';
  wallet_address?: string;
  role?: 'admin' | 'moderator' | 'user';
  config_id?: string;
  config_value?: unknown;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the requesting wallet from header (set by frontend)
    const requestingWallet = req.headers.get('x-wallet-address')?.toLowerCase();

    if (!requestingWallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet address required', code: 'NO_WALLET' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: AdminOperationRequest = await req.json();
    const { operation, wallet_address, role, config_id, config_value } = body;

    // Security check: Verify requesting wallet is an admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('wallet_address', requestingWallet)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Access denied - Admin only', code: 'NOT_ADMIN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different operations
    switch (operation) {
      case 'add_admin': {
        // CRITICAL: Only MASTER_ADMIN can add new admins
        if (requestingWallet !== MASTER_ADMIN_WALLET) {
          return new Response(
            JSON.stringify({ 
              error: 'Only the Master Admin can add new administrators',
              code: 'MASTER_ADMIN_REQUIRED',
              hint: 'Contact the platform owner to add new admins'
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!wallet_address) {
          return new Response(
            JSON.stringify({ error: 'Wallet address required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const targetWallet = wallet_address.toLowerCase();

        // Check if already exists
        const { data: existing } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('wallet_address', targetWallet)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ error: 'User already has a role' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: insertError } = await supabaseAdmin
          .from('user_roles')
          .insert({ wallet_address: targetWallet, role: 'admin' });

        if (insertError) {
          console.error('Insert error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to add admin' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the action for audit
        console.log(`[AUDIT] Admin added: ${targetWallet} by ${requestingWallet}`);

        return new Response(
          JSON.stringify({ success: true, message: 'Admin added successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'remove_admin': {
        // CRITICAL: Only MASTER_ADMIN can remove admins
        if (requestingWallet !== MASTER_ADMIN_WALLET) {
          return new Response(
            JSON.stringify({ 
              error: 'Only the Master Admin can remove administrators',
              code: 'MASTER_ADMIN_REQUIRED'
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!wallet_address) {
          return new Response(
            JSON.stringify({ error: 'Wallet address required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const targetWallet = wallet_address.toLowerCase();

        // Cannot remove MASTER_ADMIN
        if (targetWallet === MASTER_ADMIN_WALLET) {
          return new Response(
            JSON.stringify({ error: 'Cannot remove Master Admin' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('wallet_address', targetWallet);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Failed to remove admin' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[AUDIT] Admin removed: ${targetWallet} by ${requestingWallet}`);

        return new Response(
          JSON.stringify({ success: true, message: 'Admin removed successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_role': {
        // Moderators can be managed by any admin, but admin role requires MASTER_ADMIN
        if (!wallet_address || !role) {
          return new Response(
            JSON.stringify({ error: 'Wallet address and role required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const targetWallet = wallet_address.toLowerCase();

        // If trying to set admin role, only MASTER_ADMIN can do it
        if (role === 'admin' && requestingWallet !== MASTER_ADMIN_WALLET) {
          return new Response(
            JSON.stringify({ 
              error: 'Only Master Admin can grant admin role',
              code: 'MASTER_ADMIN_REQUIRED'
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if role exists
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('wallet_address', targetWallet)
          .single();

        if (existingRole) {
          // Update existing
          const { error } = await supabaseAdmin
            .from('user_roles')
            .update({ role })
            .eq('wallet_address', targetWallet);

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Failed to update role' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          // Insert new
          const { error } = await supabaseAdmin
            .from('user_roles')
            .insert({ wallet_address: targetWallet, role });

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Failed to add role' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        console.log(`[AUDIT] Role updated: ${targetWallet} -> ${role} by ${requestingWallet}`);

        return new Response(
          JSON.stringify({ success: true, message: 'Role updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_config': {
        // CRITICAL: Only MASTER_ADMIN can modify platform config
        if (requestingWallet !== MASTER_ADMIN_WALLET) {
          return new Response(
            JSON.stringify({ 
              error: 'Only Master Admin can modify platform configuration',
              code: 'MASTER_ADMIN_REQUIRED'
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!config_id || config_value === undefined) {
          return new Response(
            JSON.stringify({ error: 'Config ID and value required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('platform_config')
          .update({ 
            value: config_value,
            updated_by: requestingWallet,
            updated_at: new Date().toISOString()
          })
          .eq('id', config_id);

        if (error) {
          console.error('Config update error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update config' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[AUDIT] Config updated: ${config_id} by ${requestingWallet}`);

        return new Response(
          JSON.stringify({ success: true, message: 'Config updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Admin operation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
