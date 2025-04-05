
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Export the supabase client for use in the app
export const supabase = supabaseClient;

// You can add additional utility functions related to Supabase here
