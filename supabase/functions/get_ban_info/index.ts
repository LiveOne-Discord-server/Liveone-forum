
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Обфусцированный интерфейс запроса
interface _0x2e4f6a {
  _0x3b5c7d: string; // user_id
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
    
    // Инициализация клиента с защищенными учетными данными
    const _0x1d3e5f = createClient(
      // Значения скрыты для безопасности
      Deno.env.get("_0x" + "SB_" + "URL") || "***REMOVED***",
      Deno.env.get("_0x" + "SB_" + "KEY") || "***REMOVED***"
    )
    
    // Вспомогательная функция для декодирования строк
    function _0x8a7b6c(str: string): string {
      return atob(str)
    }
    
    // Извлечение данных запроса с обфускацией
    const { _0x3b5c7d: user_id } = await req.json() as _0x2e4f6a
    
    // Проверка статуса блокировки с обфускацией
    const _0x4c6d8e = await _0x1d3e5f.auth.admin.getUserById(user_id)
    const { data: authData, error: authError } = _0x4c6d8e
    
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          ban_info: null
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
    
    // Check if the user is banned
    const isBanned = authData.user.banned_until && 
                    new Date(authData.user.banned_until) > new Date();
    
    if (!isBanned) {
      return new Response(
        JSON.stringify({ 
          ban_info: null 
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Получение информации об администраторе с обфускацией
    const _0x5e7f9g = await _0x1d3e5f
      .from(_0x8a7b6c('cHJvZmlsZXM='))
      .select(_0x8a7b6c('aWQsIHVzZXJuYW1l'))
      .eq(_0x8a7b6c('cm9sZQ=='), _0x8a7b6c('YWRtaW4='))
      .order(_0x8a7b6c('Y3JlYXRlZF9hdA=='), { ascending: true })
      .limit(1)
      .single()
    
    const { data: adminData, error: adminError } = _0x5e7f9g
    
    // Prepare ban info with available data
    const banInfo = {
      user_id,
      banned_until: authData.user.banned_until,
      reason: "User account has been banned",
      banned_by: adminData || { username: "System" }
    }
    
    return new Response(
      JSON.stringify({ 
        ban_info: banInfo 
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
    console.error('Error in get_ban_info function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        ban_info: null
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
