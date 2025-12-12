import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { 
  corsHeaders, 
  verifyAdminAuth, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/auth-utils.ts";

const ReinviteSchema = z.object({
  userId: z.string().uuid({ message: 'userId must be a valid UUID' }),
  email: z.string().email({ message: 'Invalid email address' }),
});

async function reinviteUserHandler(req: Request): Promise<Response> {
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
    const parseResult = ReinviteSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation error:', errors);
      return createErrorResponse(`Validation failed: ${errors}`, 400);
    }

    const { userId, email } = parseResult.data;
    console.log(`Resending invite to user: ${userId} (${email})`);

    // Verify the userId matches an existing user
    const { data: userToReinvite, error: userLookupError } = 
      await adminClient.auth.admin.getUserById(userId);

    if (userLookupError || !userToReinvite.user) {
      console.error("User lookup error:", userLookupError);
      return createErrorResponse("User not found", 404);
    }

    // Verify email matches the userId
    if (userToReinvite.user.email?.toLowerCase() !== email.toLowerCase()) {
      console.error(`Email mismatch: expected ${userToReinvite.user.email}, got ${email}`);
      return createErrorResponse("Email does not match user ID", 400);
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";
    const redirectTo = `${origin}/reset-password`;
    console.log(`Redirect URL: ${redirectTo}`);

    const { error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      return createErrorResponse(linkError.message, 400);
    }

    console.log(`Invite link generated for ${email}`);

    return createSuccessResponse({ success: true, userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in reinvite-user-builtin function:", error);
    return createErrorResponse(message, 500);
  }
}

serve(reinviteUserHandler);
