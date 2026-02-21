/**
 * Supabase Mock - מוק לכל קריאות Supabase בבדיקות
 */
import { vi } from 'vitest';

// Mock response builder
function createQueryBuilder(defaultData: any[] = [], defaultError: any = null) {
  const builder: any = {
    _data: defaultData,
    _error: defaultError,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: builder._data?.[0] || null, error: builder._error })
    ),
    maybeSingle: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: builder._data?.[0] || null, error: builder._error })
    ),
    then: function (resolve: any) {
      return resolve({ data: builder._data, error: builder._error });
    },
  };

  // Make the builder thenable (for await)
  builder[Symbol.for('thenable')] = true;

  return builder;
}

// Main mock
export const mockSupabase = {
  from: vi.fn((table: string) => createQueryBuilder()),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test/file.txt' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.txt' } }),
    })),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  })),
};

// Auto-mock the supabase client module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

export { createQueryBuilder };
