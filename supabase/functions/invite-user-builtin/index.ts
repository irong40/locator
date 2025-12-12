import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { 
  corsHeaders, 
  verifyAdminAuth, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/auth-utils.ts";

const InviteSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).max(255, { message: 'Email must be less than 255 characters' }),
  firstName: z.string().trim().min(1, { message: 'First name is required' }).max(100, { message: 'First name must be less than 100 characters' }),
  lastName: z.string().trim().min(1, { message: 'Last name is required' }).max(100, { message: 'Last name must be less than 100 characters' }),
  roleId: z.string().uuid({ message: 'roleId must be a valid UUID' }),
});

async function inviteUserHandler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminClient } = authResult;

    const rawBody = await req.json();
    const parseResult = InviteSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation error:', errors);
      return createErrorResponse(`Validation failed: ${errors}`, 400);
    }

    const { email, firstName, lastName, roleId } = parseResult.data;
    console.log(`Inviting user: ${email} with role: ${roleId}`);

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      console.log(`User ${email} already exists with id: ${existingUser.id}`);
      return createErrorResponse(
        "This email is already registered. Use 'Resend Invite' to send a new invitation link.",
        400
      );
    }

    const redirectTo = "https://locator.dradamopierce.com/reset-password";
    console.log(`Redirect URL: ${redirectTo}`);

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: { first_name: firstName, last_name: lastName },
      }
    );

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return createErrorResponse(inviteError.message, 400);
    }

    const userId = inviteData.user.id;
    console.log(`User invited: ${userId}`);

    // Assign role - delete any existing first (shouldn't exist for new user, but be safe)
    await adminClient
      .from("user_role_assignments")
      .delete()
      .eq("user_id", userId);

    const { error: roleAssignError } = await adminClient
      .from("user_role_assignments")
      .insert({ user_id: userId, role_id: roleId });

    if (roleAssignError) {
      console.error("Role assignment error:", roleAssignError);
      // Continue anyway, role can be assigned manually
    } else {
      console.log(`Role ${roleId} assigned to user ${userId}`);
    }

    return createSuccessResponse({ success: true, userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in invite-user-builtin function:", error);
    return createErrorResponse(message, 500);
  }
}

serve(inviteUserHandler);
