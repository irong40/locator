import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for request validation
const InviteSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).max(255, { message: 'Email must be less than 255 characters' }),
  firstName: z.string().trim().min(1, { message: 'First name is required' }).max(100, { message: 'First name must be less than 100 characters' }),
  lastName: z.string().trim().min(1, { message: 'Last name is required' }).max(100, { message: 'Last name must be less than 100 characters' }),
  roleId: z.string().uuid({ message: 'roleId must be a valid UUID' }),
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
        JSON.stringify({ error: "Only admins can send invitations" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const parseResult = InviteSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation error:', errors);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, firstName, lastName, roleId } = parseResult.data;
    console.log(`Inviting user: ${email} with role: ${roleId}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      console.log(`User ${email} already exists with id: ${existingUser.id}`);
      return new Response(
        JSON.stringify({ 
          error: "This email is already registered. Use 'Resend Invite' to send a new invitation link." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the redirect URL from request origin or use default
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const redirectTo = `${origin}/reset-password`;
    console.log(`Redirect URL: ${redirectTo}`);

    // Use Supabase's built-in inviteUserByEmail
    const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
      redirectTo,
    });

    if (inviteError) {
      console.error("Invite user error:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`User invited: ${inviteData.user.id}`);

    // Assign role - delete any existing first (shouldn't exist for new user, but be safe)
    await supabaseClient
      .from("user_role_assignments")
      .delete()
      .eq("user_id", inviteData.user.id);

    const { error: assignError } = await supabaseClient
      .from("user_role_assignments")
      .insert({
        user_id: inviteData.user.id,
        role_id: roleId,
      });

    if (assignError) {
      console.error("Role assignment error:", assignError);
      // Continue anyway, role can be assigned manually
    } else {
      console.log(`Role ${roleId} assigned to user ${inviteData.user.id}`);
    }

    return new Response(
      JSON.stringify({ success: true, userId: inviteData.user.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-user-builtin function:", error);
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
