import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { Resend } from "npm:resend@2.0.0";
import { 
  corsHeaders, 
  verifyAdminAuth, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/auth-utils.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const DEFAULT_FROM_EMAIL = "Locator <info@faithandharmonyllc.com>";

function normalizeFromEmail(raw: string | null): string {
  const candidate = (raw ?? "").trim();
  if (candidate === "") return DEFAULT_FROM_EMAIL;

  // Resend expects either: email@example.com OR Name <email@example.com>
  const plainEmail = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
  const namedEmail = /^[^<>\n]+<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>$/;

  if (plainEmail.test(candidate) || namedEmail.test(candidate)) return candidate;

  console.warn("RESEND_FROM_EMAIL is invalid; falling back to DEFAULT_FROM_EMAIL.");
  return DEFAULT_FROM_EMAIL;
}

function getFromDomain(from: string): string {
  const match = from.match(/<([^>]+)>/) ?? from.match(/^([^\s<>]+@[^\s<>]+)$/);
  const email = match?.[1] ?? from;
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1) : "unknown";
}

const FROM_EMAIL = normalizeFromEmail(Deno.env.get("RESEND_FROM_EMAIL"));

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

    // Create user without sending email (we'll send via Resend)
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { first_name: firstName, last_name: lastName },
    });

    if (createError) {
      console.error("Create user error:", createError);
      return createErrorResponse(createError.message, 400);
    }

    const userId = createData.user.id;
    console.log(`User created: ${userId}`);

    // Generate invite link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      return createErrorResponse("User created but failed to generate invite link. Use 'Resend Invite' to send invitation.", 500);
    }

    const actionLink = linkData.properties.action_link;
    console.log(`Generated invite link for ${email}`);

    // Assign role
    await adminClient
      .from("user_role_assignments")
      .delete()
      .eq("user_id", userId);

    const { error: roleAssignError } = await adminClient
      .from("user_role_assignments")
      .insert({ user_id: userId, role_id: roleId });

    if (roleAssignError) {
      console.error("Role assignment error:", roleAssignError);
    } else {
      console.log(`Role ${roleId} assigned to user ${userId}`);
    }

    // Send invitation email via Resend
    console.log(`Sending invite email (from domain: ${getFromDomain(FROM_EMAIL)})`);
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "You've been invited to Locator",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Locator!</h2>
          <p>Hi ${firstName},</p>
          <p>You've been invited to join the Locator platform. Click the button below to set up your password and access your account.</p>
          <p style="margin: 30px 0;">
            <a href="${actionLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Set Up Your Account
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #2563eb; font-size: 14px; word-break: break-all;">${actionLink}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">If you did not expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Failed to send invite email:", emailResponse.error);
      return createErrorResponse("User created but failed to send invitation email. Use 'Resend Invite' to try again.", 500);
    }

    console.log(`Invite email sent successfully to ${email}`);
    return createSuccessResponse({ success: true, userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in invite-user-builtin function:", error);
    return createErrorResponse(message, 500);
  }
}

serve(inviteUserHandler);
