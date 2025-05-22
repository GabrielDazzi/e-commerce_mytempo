
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have the required configuration
const hasSupabaseConfig = supabaseUrl && supabaseAnonKey;

// Create a client if we have the config, otherwise create a mock client for development
export const supabase = hasSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Simple mock client for development when Supabase credentials aren't available
function createMockClient() {
  console.warn('⚠️ Supabase credentials missing! Using mock client. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  
  // Return a mock implementation that logs operations instead of executing them
  return {
    from: (table: string) => ({
      select: () => {
        console.log(`Mock: SELECT from ${table}`);
        return { data: [], error: null };
      },
      insert: () => {
        console.log(`Mock: INSERT into ${table}`);
        return { data: null, error: null };
      },
      update: () => {
        console.log(`Mock: UPDATE in ${table}`);
        return { data: null, error: null };
      },
      delete: () => {
        console.log(`Mock: DELETE from ${table}`);
        return { data: null, error: null };
      },
      eq: () => ({ data: null, error: null }),
      order: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null }),
    }),
    storage: {
      from: (bucket: string) => ({
        upload: () => {
          console.log(`Mock: UPLOAD to ${bucket}`);
          return { data: null, error: null };
        },
        getPublicUrl: () => {
          console.log(`Mock: GET URL from ${bucket}`);
          return { data: { publicUrl: '' }, error: null };
        },
      }),
    },
    auth: {
      signUp: () => {
        console.log('Mock: SIGNUP');
        return { data: null, error: null };
      },
      signIn: () => {
        console.log('Mock: SIGNIN');
        return { data: null, error: null };
      },
      signOut: () => {
        console.log('Mock: SIGNOUT');
        return { data: null, error: null };
      },
    },
    rpc: (func: string) => {
      console.log(`Mock: RPC call to ${func}`);
      return { data: null, error: null };
    },
  };
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => hasSupabaseConfig;
