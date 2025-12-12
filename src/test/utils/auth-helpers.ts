import { supabase } from '@/integrations/supabase/client';

/**
 * Test user credentials for integration tests
 * These should be configured in environment variables for CI/CD
 */
const TEST_ADMIN_EMAIL = import.meta.env.VITE_TEST_ADMIN_EMAIL || 'test-admin@example.com';
const TEST_ADMIN_PASSWORD = import.meta.env.VITE_TEST_ADMIN_PASSWORD || 'test-password';

export interface TestSession {
  accessToken: string;
  userId: string;
}

/**
 * Get an authenticated admin session for integration tests
 * Requires a test admin user to exist in the database
 */
export async function getAdminSession(): Promise<TestSession | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
  });

  if (error || !data.session) {
    console.error('Failed to get admin session:', error?.message);
    return null;
  }

  return {
    accessToken: data.session.access_token,
    userId: data.user.id,
  };
}

/**
 * Sign out the current user session
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Generate a unique test email to avoid conflicts
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-user-${timestamp}-${random}@example.com`;
}

/**
 * Clean up a test user by ID (requires admin privileges)
 * This should be called in afterEach/afterAll hooks
 */
export async function cleanupTestUser(userId: string, accessToken: string): Promise<boolean> {
  try {
    const response = await supabase.functions.invoke('delete-user', {
      body: { userId },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return !response.error;
  } catch {
    console.error('Failed to cleanup test user:', userId);
    return false;
  }
}

/**
 * Create authorization headers for edge function calls
 */
export function createAuthHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Call an edge function with proper auth headers
 */
export async function callEdgeFunction<T>(
  functionName: string,
  body: unknown,
  accessToken?: string
): Promise<{ data: T | null; error: Error | null; status?: number }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await supabase.functions.invoke(functionName, {
      body,
      headers,
    });

    return {
      data: response.data as T,
      error: response.error,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
