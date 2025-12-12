import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for request validation
const ResendInviteSchema = z.object({
  userId: z.string().uuid({ message: 'userId must be a valid UUID' }),
  email: z.string().email({ message: 'Invalid email address' }).max(255, { message: 'Email must be less than 255 characters' }),
  firstName: z.string().trim().max(100, { message: 'First name must be less than 100 characters' }).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    
    // Verify the user making the request
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_role_assignments")
      .select("user_roles!inner(role_name)")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleError || (roleData as any)?.user_roles?.role_name !== "Admin") {
      console.error("Role check failed:", roleError);
      return new Response(
        JSON.stringify({ error: "Only admins can resend invitations" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const parseResult = ResendInviteSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation error:', errors);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId, email, firstName } = parseResult.data;
    console.log(`Resending invite to user: ${email} (${userId})`);

    // Generate password reset link for the existing user
    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://lovable.dev"}/reset-password`,
      },
    });

    if (resetError) {
      console.error("Reset link error:", resetError);
      return new Response(
        JSON.stringify({ error: "Failed to generate invitation link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const inviteLink = resetData.properties.action_link;
    console.log(`Generated resend invite link for ${email}`);

    // Send invitation email using configured from address
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "C&R Repair <onboarding@resend.dev>";
    console.log(`Sending resend invite email from: ${fromEmail} to: ${email}`);
    
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Your Invitation to C&R Repair Vendor Management",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">C&R Repair</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hi ${firstName || "there"},</p>
            <p style="font-size: 16px;">We're resending your invitation to the C&R Repair Vendor Management system.</p>
            <p style="font-size: 16px;">Click the button below to set up your password and access your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Set Up Your Account</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">This link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">C&R Repair - Vendor Management System</p>
          </div>
        </body>
        </html>
      `,
    });

    // Check for email sending errors
    if (emailResponse.error) {
      console.error("Resend email error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: `Failed to send invitation email: ${emailResponse.error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Resend invite email sent successfully:", emailResponse.data);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in resend-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
