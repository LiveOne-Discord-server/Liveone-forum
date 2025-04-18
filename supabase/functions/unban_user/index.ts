
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

interface UnbanUserRequest {
  admin_id: string;
  user_id: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    )
    
    // Get request payload
    const { admin_id, user_id } = await req.json() as UnbanUserRequest
    
    // Verify admin has permission
    const { data: adminData, error: adminError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', admin_id)
      .single()
    
    if (adminError || !adminData || (adminData.role !== 'admin' && adminData.role !== 'moderator')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Verify user to unban exists
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()
    
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if user is actually banned
    const { data: existingBan, error: banCheckError } = await supabaseClient
      .from('banned_users')
      .select('*')
      .eq('user_id', user_id)
      .single()
    
    if (!existingBan) {
      return new Response(
        JSON.stringify({ error: 'User is not banned' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Remove ban record
    const { error: deleteError } = await supabaseClient
      .from('banned_users')
      .delete()
      .eq('user_id', user_id)
    
    if (deleteError) {
      console.error('Error unbanning user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to unban user' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Re-enable the user in auth.users
    await supabaseClient.auth.admin.updateUserById(
      user_id,
      { banned_until: null }
    )
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User has been unbanned'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in unban_user function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
