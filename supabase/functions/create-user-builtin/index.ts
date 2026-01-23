import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import {
  corsHeaders,
  verifyAdminAuth,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/auth-utils.ts";

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roleId: z.string().uuid("Invalid role ID"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const length = 12;
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (v) => chars[v % chars.length]).join("");
}

async function createUserHandler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("create-user-builtin: Received request");

  // Verify admin authentication
  const authResult = await verifyAdminAuth(req);
  if (!authResult.success) {
    return authResult.response;
  }

  const { adminClient } = authResult;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.error("Failed to parse request body");
    return createErrorResponse("Invalid JSON body", 400);
  }

  const parseResult = CreateUserSchema.safeParse(body);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors.map((e) => e.message).join(", ");
    console.error("Validation error:", errorMessage);
    return createErrorResponse(errorMessage, 400);
  }

  const { email, firstName, lastName, roleId, password: providedPassword } = parseResult.data;
  const normalizedEmail = email.toLowerCase().trim();

  console.log(`Creating user directly: ${normalizedEmail}`);

  // Generate password if not provided
  const password = providedPassword || generateSecurePassword();
  const passwordWasGenerated = !providedPassword;

  // Check if user already exists
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === normalizedEmail
  );

  if (existingUser) {
    console.error("User already exists:", normalizedEmail);
    return createErrorResponse("A user with this email already exists", 409);
  }

  // Create user with email confirmed (no invite email)
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true, // Mark email as confirmed immediately
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (createError || !newUser.user) {
    console.error("Failed to create user:", createError);
    return createErrorResponse(createError?.message || "Failed to create user", 500);
  }

  const userId = newUser.user.id;
  console.log(`User created with ID: ${userId}`);

  // Assign role
  const { error: deleteRoleError } = await adminClient
    .from("user_role_assignments")
    .delete()
    .eq("user_id", userId);

  if (deleteRoleError) {
    console.warn("Failed to clear existing role (may not exist):", deleteRoleError);
  }

  const { error: insertRoleError } = await adminClient
    .from("user_role_assignments")
    .insert({ user_id: userId, role_id: roleId });

  if (insertRoleError) {
    console.error("Failed to assign role:", insertRoleError);
    // User was created, so return partial success
    return createSuccessResponse({
      success: true,
      userId,
      password: passwordWasGenerated ? password : undefined,
      warning: "User created but role assignment failed: " + insertRoleError.message,
    });
  }

  console.log(`User ${normalizedEmail} created successfully with role assigned`);

  return createSuccessResponse({
    success: true,
    userId,
    // Only return password if it was auto-generated
    password: passwordWasGenerated ? password : undefined,
  });
}

serve(createUserHandler);
