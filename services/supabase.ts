/**
 * Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { SUPABASE_CONFIG } from '../config/supabase';

// Create Supabase client
export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url, 
  SUPABASE_CONFIG.anonKey, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Export types for use throughout the app
export type SupabaseClient = typeof supabase;
