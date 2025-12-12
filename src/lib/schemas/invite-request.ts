import { z } from 'zod';

/**
 * Schema for invite user request - mirrors edge function validation
 */
export const inviteRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  firstName: z
    .string()
    .trim()
    .min(1, { message: 'First name is required' })
    .max(100, { message: 'First name must be less than 100 characters' }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: 'Last name is required' })
    .max(100, { message: 'Last name must be less than 100 characters' }),
  roleId: z.string().uuid({ message: 'roleId must be a valid UUID' }),
});

/**
 * Schema for reinvite user request - mirrors edge function validation
 */
export const reinviteRequestSchema = z.object({
  userId: z.string().uuid({ message: 'userId must be a valid UUID' }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address' }),
});

export type InviteRequest = z.infer<typeof inviteRequestSchema>;
export type ReinviteRequest = z.infer<typeof reinviteRequestSchema>;
