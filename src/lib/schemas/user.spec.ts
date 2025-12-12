import { describe, expect, test } from 'vitest';
import { inviteSchema, profileEditSchema } from './user';

describe('inviteSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  test('accepts valid invite data', () => {
    const result = inviteSchema.safeParse({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roleId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  test('trims whitespace from all fields', () => {
    const result = inviteSchema.safeParse({
      email: '  john@example.com  ',
      firstName: '  John  ',
      lastName: '  Doe  ',
      roleId: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: validUuid,
      });
    }
  });

  test('rejects invalid email', () => {
    const result = inviteSchema.safeParse({
      email: 'not-an-email',
      firstName: 'John',
      lastName: 'Doe',
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });

  test('rejects email exceeding 255 characters', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    const result = inviteSchema.safeParse({
      email: longEmail,
      firstName: 'John',
      lastName: 'Doe',
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty firstName', () => {
    const result = inviteSchema.safeParse({
      email: 'john@example.com',
      firstName: '',
      lastName: 'Doe',
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('First name is required');
    }
  });

  test('rejects whitespace-only firstName', () => {
    const result = inviteSchema.safeParse({
      email: 'john@example.com',
      firstName: '   ',
      lastName: 'Doe',
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('First name is required');
    }
  });

  test('rejects firstName exceeding 100 characters', () => {
    const result = inviteSchema.safeParse({
      email: 'john@example.com',
      firstName: 'J'.repeat(101),
      lastName: 'Doe',
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty lastName', () => {
    const result = inviteSchema.safeParse({
      email: 'john@example.com',
      firstName: 'John',
      lastName: '',
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Last name is required');
    }
  });

  test('rejects invalid UUID for roleId', () => {
    const result = inviteSchema.safeParse({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roleId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please select a role');
    }
  });
});

describe('profileEditSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  test('accepts valid profile data with phone', () => {
    const result = profileEditSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-123-4567',
      roleId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  test('accepts valid profile data without phone', () => {
    const result = profileEditSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      roleId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  test('accepts empty phone string', () => {
    const result = profileEditSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      phone: '',
      roleId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  test('trims whitespace from all fields', () => {
    const result = profileEditSchema.safeParse({
      firstName: '  John  ',
      lastName: '  Doe  ',
      phone: '  555-1234  ',
      roleId: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-1234',
        roleId: validUuid,
      });
    }
  });

  test('rejects phone exceeding 20 characters', () => {
    const result = profileEditSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      phone: '1'.repeat(21),
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty firstName', () => {
    const result = profileEditSchema.safeParse({
      firstName: '',
      lastName: 'Doe',
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('First name is required');
    }
  });

  test('rejects empty lastName', () => {
    const result = profileEditSchema.safeParse({
      firstName: 'John',
      lastName: '',
      roleId: validUuid,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Last name is required');
    }
  });

  test('rejects invalid UUID for roleId', () => {
    const result = profileEditSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      roleId: 'invalid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please select a role');
    }
  });
});
