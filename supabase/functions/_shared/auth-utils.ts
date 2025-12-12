import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoleQueryResult {
  user_roles: {
    role_name: string;
  };
}

interface AdminAuthResult {
  success: true;
  requestingUser: User;
  adminClient: SupabaseClient;
}

interface AdminAuthError {
  success: false;
  response: Response;
}

export type VerifyAdminAuthResult = AdminAuthResult | AdminAuthError;

export function createErrorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

export function createSuccessResponse(data: object, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

export async function verifyAdminAuth(req: Request): Promise<VerifyAdminAuthResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("No authorization header provided");
    return {
      success: false,
      response: createErrorResponse("No authorization header", 401),
    };
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user: requestingUser }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !requestingUser) {
    console.error("Auth error:", authError);
    return {
      success: false,
      response: createErrorResponse("Unauthorized", 401),
    };
  }

  const { data: roleData, error: roleError } = await adminClient
    .from("user_role_assignments")
    .select("user_roles!inner(role_name)")
    .eq("user_id", requestingUser.id)
    .single();

  const typedRoleData = roleData as RoleQueryResult | null;

  if (roleError || typedRoleData?.user_roles?.role_name !== "Admin") {
    console.error("Role check failed:", roleError);
    return {
      success: false,
      response: createErrorResponse("Only admins can perform this action", 403),
    };
  }

  return {
    success: true,
    requestingUser,
    adminClient,
  };
}
