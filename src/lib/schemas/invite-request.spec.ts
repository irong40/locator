import { describe, expect, test } from 'vitest';
import { inviteRequestSchema, reinviteRequestSchema } from './invite-request';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('inviteRequestSchema', () => {
  describe('valid inputs', () => {
    test('parses valid invite request', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(input);
    });

    test('trims and lowercases email', () => {
      const input = {
        email: '  TEST@EXAMPLE.COM  ',
        firstName: 'John',
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });

    test('trims whitespace from names', () => {
      const input = {
        email: 'test@example.com',
        firstName: '  John  ',
        lastName: '  Doe  ',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data?.firstName).toBe('John');
      expect(result.data?.lastName).toBe('Doe');
    });
  });

  describe('invalid emails', () => {
    test('rejects invalid email format', () => {
      const input = {
        email: 'not-an-email',
        firstName: 'John',
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Invalid email address');
    });

    test('rejects email exceeding 255 characters', () => {
      const input = {
        email: 'a'.repeat(250) + '@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Email must be less than 255 characters');
    });
  });

  describe('invalid names', () => {
    test('rejects empty firstName', () => {
      const input = {
        email: 'test@example.com',
        firstName: '',
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('First name is required');
    });

    test('rejects whitespace-only firstName', () => {
      const input = {
        email: 'test@example.com',
        firstName: '   ',
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test('rejects empty lastName', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: '',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Last name is required');
    });

    test('rejects firstName exceeding 100 characters', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'a'.repeat(101),
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('First name must be less than 100 characters');
    });

    test('rejects lastName exceeding 100 characters', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'a'.repeat(101),
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Last name must be less than 100 characters');
    });
  });

  describe('invalid roleId', () => {
    test('rejects non-UUID roleId', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'not-a-uuid',
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('roleId must be a valid UUID');
    });

    test('rejects missing roleId', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('missing fields', () => {
    test('rejects missing email', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test('rejects missing firstName', () => {
      const input = {
        email: 'test@example.com',
        lastName: 'Doe',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test('rejects missing lastName', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        roleId: VALID_UUID,
      };
      const result = inviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

describe('reinviteRequestSchema', () => {
  describe('valid inputs', () => {
    test('parses valid reinvite request', () => {
      const input = {
        userId: VALID_UUID,
        email: 'test@example.com',
      };
      const result = reinviteRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(input);
    });

    test('trims and lowercases email', () => {
      const input = {
        userId: VALID_UUID,
        email: '  TEST@EXAMPLE.COM  ',
      };
      const result = reinviteRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });
  });

  describe('invalid inputs', () => {
    test('rejects invalid userId UUID', () => {
      const input = {
        userId: 'not-a-uuid',
        email: 'test@example.com',
      };
      const result = reinviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('userId must be a valid UUID');
    });

    test('rejects invalid email format', () => {
      const input = {
        userId: VALID_UUID,
        email: 'not-an-email',
      };
      const result = reinviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Invalid email address');
    });

    test('rejects missing userId', () => {
      const input = {
        email: 'test@example.com',
      };
      const result = reinviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test('rejects missing email', () => {
      const input = {
        userId: VALID_UUID,
      };
      const result = reinviteRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
