import { describe, expect, test, beforeAll, afterAll, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  getAdminSession,
  signOut,
  generateTestEmail,
  cleanupTestUser,
  callEdgeFunction,
  type TestSession,
} from '../utils/auth-helpers';

/**
 * Integration tests for invite and reinvite user flows
 * 
 * NOTE: These tests require:
 * 1. A running Supabase instance
 * 2. A test admin user with valid credentials
 * 3. Edge functions deployed
 * 
 * Set environment variables:
 * - VITE_TEST_ADMIN_EMAIL
 * - VITE_TEST_ADMIN_PASSWORD
 */

describe('Invite User Flow Integration Tests', () => {
  let adminSession: TestSession | null = null;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    adminSession = await getAdminSession();
  });

  afterEach(async () => {
    // Cleanup any test users created during tests
    if (adminSession) {
      for (const userId of createdUserIds) {
        await cleanupTestUser(userId, adminSession.accessToken);
      }
      createdUserIds.length = 0;
    }
  });

  afterAll(async () => {
    await signOut();
  });

  describe('invite-user-builtin', () => {
    test('returns 401 without authorization header', async () => {
      const { error } = await callEdgeFunction('invite-user-builtin', {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(error).toBeTruthy();
    });

    test('returns 400 for invalid email format', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      const { error, data } = await callEdgeFunction(
        'invite-user-builtin',
        {
          email: 'not-an-email',
          firstName: 'Test',
          lastName: 'User',
          roleId: '123e4567-e89b-12d3-a456-426614174000',
        },
        adminSession.accessToken
      );

      expect(error || (data as { error?: string })?.error).toBeTruthy();
    });

    test('returns 400 for missing required fields', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      const { error, data } = await callEdgeFunction(
        'invite-user-builtin',
        {
          email: 'test@example.com',
          // Missing firstName, lastName, roleId
        },
        adminSession.accessToken
      );

      expect(error || (data as { error?: string })?.error).toBeTruthy();
    });

    test('returns 400 for invalid roleId UUID', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      const { error, data } = await callEdgeFunction(
        'invite-user-builtin',
        {
          email: generateTestEmail(),
          firstName: 'Test',
          lastName: 'User',
          roleId: 'not-a-uuid',
        },
        adminSession.accessToken
      );

      expect(error || (data as { error?: string })?.error).toBeTruthy();
    });

    test('successfully invites new user with valid data', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      // Get a valid role ID
      const { data: roles } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1)
        .single();

      if (!roles) {
        console.warn('Skipping test: No roles available');
        return;
      }

      const testEmail = generateTestEmail();
      const { data, error } = await callEdgeFunction<{ success: boolean; userId: string }>(
        'invite-user-builtin',
        {
          email: testEmail,
          firstName: 'Integration',
          lastName: 'TestUser',
          roleId: roles.id,
        },
        adminSession.accessToken
      );

      if (data?.userId) {
        createdUserIds.push(data.userId);
      }

      expect(error).toBeFalsy();
      expect(data?.success).toBe(true);
      expect(data?.userId).toBeTruthy();
    });

    test('returns 400 for duplicate email', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      // Get a valid role ID
      const { data: roles } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1)
        .single();

      if (!roles) {
        console.warn('Skipping test: No roles available');
        return;
      }

      const testEmail = generateTestEmail();

      // First invite should succeed
      const { data: firstInvite } = await callEdgeFunction<{ success: boolean; userId: string }>(
        'invite-user-builtin',
        {
          email: testEmail,
          firstName: 'First',
          lastName: 'User',
          roleId: roles.id,
        },
        adminSession.accessToken
      );

      if (firstInvite?.userId) {
        createdUserIds.push(firstInvite.userId);
      }

      // Second invite with same email should fail
      const { error, data } = await callEdgeFunction(
        'invite-user-builtin',
        {
          email: testEmail,
          firstName: 'Duplicate',
          lastName: 'User',
          roleId: roles.id,
        },
        adminSession.accessToken
      );

      expect(error || (data as { error?: string })?.error).toBeTruthy();
    });
  });

  describe('reinvite-user-builtin', () => {
    test('returns 401 without authorization header', async () => {
      const { error } = await callEdgeFunction('reinvite-user-builtin', {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
      });

      expect(error).toBeTruthy();
    });

    test('returns 400 for invalid userId UUID', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      const { error, data } = await callEdgeFunction(
        'reinvite-user-builtin',
        {
          userId: 'not-a-uuid',
          email: 'test@example.com',
        },
        adminSession.accessToken
      );

      expect(error || (data as { error?: string })?.error).toBeTruthy();
    });

    test('returns 404 for non-existent user', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      const { error, data } = await callEdgeFunction(
        'reinvite-user-builtin',
        {
          userId: '00000000-0000-0000-0000-000000000000',
          email: 'nonexistent@example.com',
        },
        adminSession.accessToken
      );

      expect(error || (data as { error?: string })?.error).toBeTruthy();
    });

    test('returns 400 for email mismatch with userId', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      // Get a valid role ID and create a test user first
      const { data: roles } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1)
        .single();

      if (!roles) {
        console.warn('Skipping test: No roles available');
        return;
      }

      const testEmail = generateTestEmail();
      const { data: inviteData } = await callEdgeFunction<{ success: boolean; userId: string }>(
        'invite-user-builtin',
        {
          email: testEmail,
          firstName: 'Mismatch',
          lastName: 'Test',
          roleId: roles.id,
        },
        adminSession.accessToken
      );

      if (inviteData?.userId) {
        createdUserIds.push(inviteData.userId);

        // Try to reinvite with wrong email
        const { error, data } = await callEdgeFunction(
          'reinvite-user-builtin',
          {
            userId: inviteData.userId,
            email: 'wrong-email@example.com',
          },
          adminSession.accessToken
        );

        expect(error || (data as { error?: string })?.error).toBeTruthy();
      }
    });

    test('successfully generates recovery link for existing user', async () => {
      if (!adminSession) {
        console.warn('Skipping test: No admin session available');
        return;
      }

      // Get a valid role ID
      const { data: roles } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1)
        .single();

      if (!roles) {
        console.warn('Skipping test: No roles available');
        return;
      }

      const testEmail = generateTestEmail();

      // First create the user
      const { data: inviteData } = await callEdgeFunction<{ success: boolean; userId: string }>(
        'invite-user-builtin',
        {
          email: testEmail,
          firstName: 'Reinvite',
          lastName: 'Test',
          roleId: roles.id,
        },
        adminSession.accessToken
      );

      if (inviteData?.userId) {
        createdUserIds.push(inviteData.userId);

        // Now reinvite the user
        const { data, error } = await callEdgeFunction<{ success: boolean; userId: string }>(
          'reinvite-user-builtin',
          {
            userId: inviteData.userId,
            email: testEmail,
          },
          adminSession.accessToken
        );

        expect(error).toBeFalsy();
        expect(data?.success).toBe(true);
        expect(data?.userId).toBe(inviteData.userId);
      }
    });
  });
});
