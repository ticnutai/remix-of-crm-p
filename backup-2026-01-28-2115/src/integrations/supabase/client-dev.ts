// Mock Supabase Client for Development
// This allows local development without a real Supabase connection

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if we're in demo/offline mode
const isDemoMode = !SUPABASE_URL || 
                   SUPABASE_URL.includes('YOUR_PROJECT_REF') || 
                   SUPABASE_URL === '' ||
                   !SUPABASE_PUBLISHABLE_KEY ||
                   SUPABASE_PUBLISHABLE_KEY.includes('YOUR_SUPABASE_ANON_KEY');

let supabaseClient: SupabaseClient<Database>;

if (isDemoMode) {
  console.warn('🔧 Running in DEMO MODE - No real Supabase connection');
  console.info('📝 To connect to Supabase, update the .env file with your credentials');
  
  // Create a mock client for development
  // This prevents errors but returns empty data
  supabaseClient = {
    auth: {
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { 
          message: 'Demo Mode: Please configure Supabase credentials in .env file',
          name: 'DemoModeError',
          status: 400
        }
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { 
          message: 'Demo Mode: Please configure Supabase credentials in .env file',
          name: 'DemoModeError',
          status: 400
        }
      }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getUser: async () => ({ data: { user: null }, error: null }),
      updateUser: async () => ({ 
        data: { user: null }, 
        error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } 
      }),
      resetPasswordForEmail: async () => ({ 
        data: null, 
        error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } 
      }),
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    from: () => ({
      select: () => ({
        data: [],
        error: null,
        count: 0,
        status: 200,
        statusText: 'OK',
        eq: function() { return this; },
        neq: function() { return this; },
        gt: function() { return this; },
        gte: function() { return this; },
        lt: function() { return this; },
        lte: function() { return this; },
        like: function() { return this; },
        ilike: function() { return this; },
        is: function() { return this; },
        in: function() { return this; },
        contains: function() { return this; },
        containedBy: function() { return this; },
        rangeLt: function() { return this; },
        rangeGt: function() { return this; },
        rangeGte: function() { return this; },
        rangeLte: function() { return this; },
        rangeAdjacent: function() { return this; },
        overlaps: function() { return this; },
        textSearch: function() { return this; },
        match: function() { return this; },
        not: function() { return this; },
        or: function() { return this; },
        filter: function() { return this; },
        order: function() { return this; },
        limit: function() { return this; },
        range: function() { return this; },
        single: function() { return this; },
        maybeSingle: function() { return this; },
        csv: function() { return this; },
        then: function(resolve: any) { 
          return Promise.resolve(resolve({ data: [], error: null })); 
        },
      }),
      insert: () => ({
        data: null,
        error: { message: 'Demo Mode: Cannot insert data', name: 'DemoModeError', status: 400 },
        select: function() { return this; },
        single: function() { return this; },
        then: function(resolve: any) { 
          return Promise.resolve(resolve({ 
            data: null, 
            error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } 
          })); 
        },
      }),
      update: () => ({
        data: null,
        error: { message: 'Demo Mode: Cannot update data', name: 'DemoModeError', status: 400 },
        eq: function() { return this; },
        select: function() { return this; },
        single: function() { return this; },
        then: function(resolve: any) { 
          return Promise.resolve(resolve({ 
            data: null, 
            error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } 
          })); 
        },
      }),
      delete: () => ({
        data: null,
        error: { message: 'Demo Mode: Cannot delete data', name: 'DemoModeError', status: 400 },
        eq: function() { return this; },
        then: function(resolve: any) { 
          return Promise.resolve(resolve({ 
            data: null, 
            error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } 
          })); 
        },
      }),
      upsert: () => ({
        data: null,
        error: { message: 'Demo Mode: Cannot upsert data', name: 'DemoModeError', status: 400 },
        select: function() { return this; },
        then: function(resolve: any) { 
          return Promise.resolve(resolve({ 
            data: null, 
            error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } 
          })); 
        },
      }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } }),
        download: async () => ({ data: null, error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } }),
        list: async () => ({ data: [], error: null }),
        remove: async () => ({ data: null, error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } }),
        createSignedUrl: async () => ({ data: null, error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    rpc: async () => ({ data: null, error: { message: 'Demo Mode', name: 'DemoModeError', status: 400 } }),
  } as any;
} else {
  // Real Supabase client
  supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

export const supabase = supabaseClient;
export const isInDemoMode = isDemoMode;
