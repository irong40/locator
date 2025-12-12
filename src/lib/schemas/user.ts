import { z } from 'zod';

export const inviteSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  roleId: z.string().uuid('Please select a role'),
});

export const profileEditSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  phone: z.string().trim().max(20).optional(),
  roleId: z.string().uuid('Please select a role'),
});

export type InviteFormData = z.infer<typeof inviteSchema>;
export type ProfileEditFormData = z.infer<typeof profileEditSchema>;
