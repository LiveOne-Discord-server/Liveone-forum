
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

interface CheckBanRequest {
  user_id: string;
}

serve(async (req) => {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    )
    
    // Get request payload
    const { user_id } = await req.json() as CheckBanRequest
    
    // Check if the user account is banned in auth.users
    const { data: authData, error: authError } = await supabaseClient.auth.admin.getUserById(user_id)
    
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          is_banned: false
        }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Check if user has a ban record
    // Use the ban date in the auth.users table to determine if banned
    const isBanned = authData.user.banned_until && 
                    new Date(authData.user.banned_until) > new Date();
    
    return new Response(
      JSON.stringify({ 
        is_banned: isBanned 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error in check_ban_status function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        is_banned: false
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        } 
      }
    )
  }
})
