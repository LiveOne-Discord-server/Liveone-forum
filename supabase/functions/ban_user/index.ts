
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Обфусцированный интерфейс запроса
interface _0x4f2a3c {
  _0x1a2b3c: string; // admin_id
  _0x4d5e6f: string; // user_id
  _0x7g8h9i: string; // reason
}

serve(async (req) => {
  try {
    // Инициализация клиента с защищенными учетными данными
    const _0x2c4d6e = createClient(
    // Значения скрыты для безопасности
    Deno.env.get("_0x" + "SB_" + "URL") || "***REMOVED***",
    Deno.env.get("_0x" + "SB_" + "KEY") || "***REMOVED***"
  )
    
    // Извлечение данных запроса
    const { _0x1a2b3c: admin_id, _0x4d5e6f: user_id, _0x7g8h9i: reason } = await req.json() as _0x4f2a3c
    
    // Проверка прав доступа с обфускацией
    const _0x3e5f7g = await _0x2c4d6e
      .from(_0x9a8b7c('cHJvZmlsZXM='))
      .select(_0x9a8b7c('cm9sZQ=='))
      .eq(_0x9a8b7c('aWQ='), admin_id)
      .single()
    
    const { data: adminData, error: adminError } = _0x3e5f7g
    
    // Вспомогательная функция для декодирования строк
    function _0x9a8b7c(str: string): string {
      return atob(str)
    }
    
    // Проверка прав с обфускацией
    const _0x5d6e7f = [_0x9a8b7c('YWRtaW4='), _0x9a8b7c('bW9kZXJhdG9y')]
    if (adminError || !adminData || !_0x5d6e7f.includes(adminData.role)) {
      return new Response(
        JSON.stringify({ _0x8h9i0j: _0x9a8b7c('VW5hdXRob3JpemVkIC0gaW5zdWZmaWNpZW50IHBlcm1pc3Npb25z') }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Проверка существования пользователя с обфускацией
    const _0x1c3e5g = await _0x2c4d6e
      .from(_0x9a8b7c('cHJvZmlsZXM='))
      .select(_0x9a8b7c('cm9sZQ=='))
      .eq(_0x9a8b7c('aWQ='), user_id)
      .single()
      
    const { data: userData, error: userError } = _0x1c3e5g
    
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    if (userData.role === 'admin' || userData.role === 'moderator') {
      return new Response(
        JSON.stringify({ error: 'Cannot ban administrators or moderators' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if user is already banned
    const { data: existingBan, error: banCheckError } = await supabaseClient
      .from('banned_users')
      .select('*')
      .eq('user_id', user_id)
      .single()
    
    if (existingBan) {
      return new Response(
        JSON.stringify({ error: 'User is already banned' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Create ban record
    const { data: banData, error: banError } = await supabaseClient
      .from('banned_users')
      .insert({
        user_id,
        admin_id,
        reason,
        banned_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (banError) {
      console.error('Error banning user:', banError)
      return new Response(
        JSON.stringify({ error: 'Failed to ban user' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Блокировка пользователя с обфускацией
    const _0x7d8e9f = new Date()
    _0x7d8e9f.setFullYear(_0x7d8e9f.getFullYear() + 80) // Блокировка на 80 лет
    
    await _0x2c4d6e.auth.admin.updateUserById(
      user_id,
      { banned_until: _0x7d8e9f.toISOString() }
    )
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User has been banned',
        ban: banData
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ban_user function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
