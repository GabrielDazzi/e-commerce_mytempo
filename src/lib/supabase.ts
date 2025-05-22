
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
  
  // Create a chainable mock builder function
  const createChainableMock = (tableName: string) => {
    const mockBuilder = {
      data: null as any,
      error: null as any,
      // Select operation (starting point)
      select: () => {
        console.log(`Mock: SELECT from ${tableName}`);
        return mockBuilder;
      },
      // Insert operation
      insert: (data: any) => {
        console.log(`Mock: INSERT into ${tableName}`, data);
        return mockBuilder;
      },
      // Update operation
      update: (data: any) => {
        console.log(`Mock: UPDATE in ${tableName}`, data);
        return mockBuilder;
      },
      // Delete operation
      delete: () => {
        console.log(`Mock: DELETE from ${tableName}`);
        return mockBuilder;
      },
      // Filter by equality
      eq: (column: string, value: any) => {
        console.log(`Mock: WHERE ${column} = ${value} in ${tableName}`);
        return mockBuilder;
      },
      // Order results
      order: (column: string, options: any = {}) => {
        console.log(`Mock: ORDER BY ${column} in ${tableName}`, options);
        return mockBuilder;
      },
      // Limit to a single result
      single: () => {
        console.log(`Mock: Get single result from ${tableName}`);
        return mockBuilder;
      },
      // Filter with OR conditions
      or: (conditions: string) => {
        console.log(`Mock: OR conditions ${conditions} in ${tableName}`);
        return mockBuilder;
      },
      // Execute the query and return mock data
      then: (callback: (result: any) => void) => {
        // For promises (if someone uses await)
        setTimeout(() => {
          callback({ data: [], error: null });
        }, 0);
        return Promise.resolve({ data: [], error: null });
      }
    };
    
    return mockBuilder;
  };

  // Return a mock implementation
  return {
    from: (table: string) => createChainableMock(table),
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
