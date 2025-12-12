import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for request validation
const ReinviteSchema = z.object({
  userId: z.string().uuid({ message: 'userId must be a valid UUID' }),
  email: z.string().email({ message: 'Invalid email address' }),
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
      console.error("No authorization header provided");
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
    const parseResult = ReinviteSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation error:', errors);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId, email } = parseResult.data;
    console.log(`Resending invite to user: ${userId} (${email})`);

    // Get the redirect URL from request origin or use default
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const redirectTo = `${origin}/reset-password`;
    console.log(`Redirect URL: ${redirectTo}`);

    // Use generateLink to create an invite link for the existing user
    // This will send a new invite email via Supabase's built-in email
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      return new Response(
        JSON.stringify({ error: linkError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Invite link generated for ${email}`);

    return new Response(
      JSON.stringify({ success: true, userId }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in reinvite-user-builtin function:", error);
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
