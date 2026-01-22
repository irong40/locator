import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { Resend } from "npm:resend@2.0.0";
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

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const DEFAULT_FROM_EMAIL = "Locator <info@faithandharmonyllc.com>";

function normalizeFromEmail(raw: string | null): string {
  const value = (raw ?? "").trim();
  if (!value) return DEFAULT_FROM_EMAIL;

  // Resend requires either:
  // - email@example.com
  // - Name <email@example.com>
  const emailOnly = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
  const nameWithEmail = /^.+<\s*[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+\s*>$/.test(value);

  if (emailOnly || nameWithEmail) return value;

  // Do not log the raw value because it may accidentally contain a secret.
  console.warn(
    "RESEND_FROM_EMAIL is invalid (expected email@example.com or Name <email@example.com>). Falling back to default.",
  );
  return DEFAULT_FROM_EMAIL;
}

const FROM_EMAIL = normalizeFromEmail(Deno.env.get("RESEND_FROM_EMAIL"));
console.log(`Using FROM email: ${FROM_EMAIL}`);

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

    const redirectTo = "https://locator.dradamopierce.com/reset-password";
    console.log(`Redirect URL: ${redirectTo}`);

    // Use "recovery" type for existing users (resend invite = password reset link)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkError || !linkData) {
      console.error("Generate link error:", linkError);
      return createErrorResponse(linkError?.message ?? "Failed to generate recovery link", 400);
    }

    // Supabase admin generateLink returns { user, properties: { action_link, ... } }
    // The action_link is the full URL users click to reset their password
    const actionLink = 
      linkData?.properties?.action_link ?? 
      (linkData as any)?.action_link ?? 
      null;

    console.log("generateLink response keys:", Object.keys(linkData ?? {}));
    console.log("linkData.properties keys:", Object.keys((linkData as any)?.properties ?? {}));

    if (!actionLink) {
      console.error("No action_link returned from generateLink", linkData);
      return createErrorResponse("Failed to generate recovery link", 500);
    }

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Reset your Locator password",
      html: `
        <h2>Reset your password</h2>
        <p>You requested a new sign-in link. Click the button below to reset your password and access your account.</p>
        <p><a href="${actionLink}">Reset password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });

    if (emailResponse.error) {
      console.error("Failed to send reinvite email:", emailResponse.error);
      return createErrorResponse(emailResponse.error.message, 500);
    }

    console.log("Reinvite email sent successfully:", emailResponse.data);

    return createSuccessResponse({ success: true, userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in reinvite-user-builtin function:", error);
    return createErrorResponse(message, 500);
  }
}

serve(reinviteUserHandler);
