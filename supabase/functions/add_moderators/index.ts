
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Fixed moderator emails
    const moderatorEmails = [
      'kraplich.volodia@tutamail.com',
      'suslikbaneritovich@gmail.com'
    ]
    
    const results = []
    
    for (const email of moderatorEmails) {
      console.log(`Setting moderator role for ${email}`)
      
      // Get user profile by email
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .maybeSingle()
      
      if (profileError) {
        console.error(`Error finding profile for ${email}:`, profileError)
        results.push({ email, success: false, error: 'Profile not found' })
        continue
      }
      
      if (!profileData) {
        console.log(`No profile found for ${email}`)
        
        // Try to find the user in auth.users
        const { data: userData, error: userError } = await supabaseClient.auth
          .admin.listUsers()
          
        if (userError) {
          console.error(`Error listing users:`, userError)
          results.push({ email, success: false, error: 'User not found' })
          continue
        }
        
        const user = userData.users.find(u => u.email === email)
        
        if (!user) {
          results.push({ email, success: false, error: 'User not found' })
          continue
        }
        
        // Create profile
        const { error: insertError } = await supabaseClient
          .from('profiles')
          .insert({
            id: user.id,
            email: email,
            username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
            role: 'moderator'
          })
        
        if (insertError) {
          console.error(`Error creating profile for ${email}:`, insertError)
          results.push({ email, success: false, error: 'Failed to create profile' })
          continue
        }
        
        results.push({ email, success: true, action: 'created profile as moderator' })
      } else {
        // Update role if needed
        if (profileData.role !== 'moderator' && profileData.role !== 'admin') {
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ role: 'moderator' })
            .eq('id', profileData.id)
          
          if (updateError) {
            console.error(`Error updating role for ${email}:`, updateError)
            results.push({ email, success: false, error: 'Failed to update role' })
            continue
          }
          
          results.push({ email, success: true, action: 'updated to moderator' })
        } else {
          results.push({ email, success: true, action: 'already has sufficient privileges' })
        }
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in add_moderators function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
