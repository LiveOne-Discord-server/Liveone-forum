// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// IMPORTANT: These are placeholder values. You need to replace them with your own Supabase credentials.
const SUPABASE_URL = "your_supabase_url";
const SUPABASE_PUBLISHABLE_KEY = "your_supabase_anon_key";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// NOTE: This is a public version of the code with obfuscated credentials.
// For development, replace the placeholder values with your actual Supabase credentials.