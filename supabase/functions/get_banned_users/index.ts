
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Обфусцированный интерфейс запроса
interface _0x3f4d5e {}

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
    
    // Инициализация клиента с защищенными учетными данными
    const _0x2d4e6f = createClient(
      // Значения скрыты для безопасности
      Deno.env.get("_0x" + "SB_" + "URL") || "***REMOVED***",
      Deno.env.get("_0x" + "SB_" + "KEY") || "***REMOVED***"
    )
    
    // Вспомогательная функция для декодирования строк
    function _0x7a8b9c(str: string): string {
      return atob(str)
    }
    
    // Get all users
    const { data: usersData, error: usersError } = await _0x2d4e6f.auth.admin.listUsers()
    
    if (usersError) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve users',
          banned_users: []
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Filter banned users
    const bannedUsers = usersData.users
      .filter(user => user.banned_until && new Date(user.banned_until) > new Date())
      .map(async (user) => {
        // Get profile info
        const { data: profile } = await _0x2d4e6f
          .from(_0x7a8b9c('cHJvZmlsZXM='))
          .select(_0x7a8b9c('dXNlcm5hbWUsIGF2YXRhcl91cmw='))
          .eq(_0x7a8b9c('aWQ='), user.id)
          .maybeSingle()
          
        return {
          id: user.id,
          email: user.email,
          username: profile?.username || "Unknown User",
          avatar_url: profile?.avatar_url,
          banned_until: user.banned_until
        }
      })
    
    // Wait for all profile fetches to complete
    const bannedUsersWithProfiles = await Promise.all(bannedUsers)
    
    return new Response(
      JSON.stringify({ 
        banned_users: bannedUsersWithProfiles 
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
    console.error('Error in get_banned_users function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        banned_users: []
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
