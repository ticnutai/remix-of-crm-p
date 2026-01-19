import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== CREATE EMPLOYEE FUNCTION START ===");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    console.log("Supabase URL:", supabaseUrl);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.log("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    console.log("Current user ID:", user?.id);
    console.log("User error:", userError);
    
    if (userError || !user) {
      console.log("ERROR: Invalid token");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    console.log("User role data:", roleData);
    console.log("Role error:", roleError);

    if (!roleData || roleData.role !== "admin") {
      console.log("ERROR: User is not admin");
      return new Response(
        JSON.stringify({ success: false, error: "Only admins can create employees" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Now use admin client to create the employee
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));
    
    const { 
      email, 
      password, 
      full_name, 
      phone, 
      department, 
      position, 
      hourly_rate, 
      role 
    } = body;

    if (!email) {
      console.log("ERROR: Email is required");
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating employee with email:", email, "role:", role);

    // Generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-12) + "A1!";

    let userId: string;
    let isExistingUser = false;

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    console.log("List users error:", listError);
    
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    console.log("Existing user found:", !!existingUser);

    if (existingUser) {
      // User exists - use their ID
      userId = existingUser.id;
      isExistingUser = true;
      console.log("Using existing user ID:", userId);
      
      // Update their metadata
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          full_name: full_name || existingUser.user_metadata?.full_name || email,
          phone: phone || existingUser.user_metadata?.phone,
          department: department || existingUser.user_metadata?.department,
          position: position || existingUser.user_metadata?.position,
        },
      });
      console.log("Update user metadata error:", updateError);
    } else {
      // Create the user with admin API
      console.log("Creating new user...");
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { 
          full_name: full_name || email,
          phone,
          department,
          position,
        },
      });

      if (createError) {
        console.log("ERROR creating user:", createError);
        return new Response(
          JSON.stringify({ success: false, error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = userData.user.id;
      console.log("New user created with ID:", userId);
    }

    // Update or create profile with additional info
    console.log("Upserting profile...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ 
        id: userId,
        email,
        full_name: full_name || email,
        phone,
        department,
        position,
        hourly_rate: hourly_rate || null,
        is_active: true,
      }, {
        onConflict: "id"
      });
    console.log("Profile upsert error:", profileError);

    // Update role - first delete existing roles for this user, then insert new one
    const roleToAssign = role || "employee";
    console.log(`Assigning role '${roleToAssign}' to user ${userId}`);
    
    // Delete any existing roles for this user
    const { error: deleteRoleError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    
    console.log("Delete existing roles error:", deleteRoleError);
    
    // Insert the new role
    const { data: insertedRole, error: insertRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ 
        user_id: userId, 
        role: roleToAssign 
      })
      .select()
      .single();
    
    console.log("Insert role result:", insertedRole);
    console.log("Insert role error:", insertRoleError);

    // Send password reset email only for new users
    if (!isExistingUser) {
      console.log("Generating recovery link...");
      const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
      });
      console.log("Recovery link error:", linkError);
    }

    console.log("=== CREATE EMPLOYEE FUNCTION SUCCESS ===");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isExistingUser 
          ? `משתמש קיים ${email} נוסף כעובד בהצלחה`
          : `עובד חדש ${email} נוצר בהצלחה`,
        user_id: userId,
        temp_password: isExistingUser ? null : tempPassword,
        is_existing_user: isExistingUser,
        role_assigned: roleToAssign,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.log("=== CREATE EMPLOYEE FUNCTION ERROR ===");
    console.log("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
