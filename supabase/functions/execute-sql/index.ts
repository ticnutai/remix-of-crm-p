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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated and is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user is admin using RPC
    const { data: isAdmin, error: roleError } = await userClient.rpc("is_admin", {
      _user_id: userId,
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { sql, migration_name } = await req.json();

    if (!sql || typeof sql !== "string") {
      return new Response(
        JSON.stringify({ error: "SQL query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Execute SQL using the REST API directly
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    
    if (!dbUrl) {
      return new Response(
        JSON.stringify({ error: "Database URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use postgres connection to execute raw SQL
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    const client = new Client(dbUrl);
    await client.connect();

    try {
      // Execute the SQL directly - supports all SQL including CREATE FUNCTION with $$
      const result = await client.queryObject(sql);

      // Log successful migration if name provided
      if (migration_name) {
        await adminClient
          .from("migration_logs")
          .insert({
            name: migration_name,
            sql_content: sql,
            executed_at: new Date().toISOString(),
            success: true,
            executed_by: userId,
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "SQL executed successfully",
          migration_name: migration_name || null,
          rows_affected: result.rowCount || 0,
          data: result.rows || [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (sqlError) {
      const errorMessage = sqlError instanceof Error ? sqlError.message : "SQL execution failed";

      // Log failed migration if name provided
      if (migration_name) {
        await adminClient
          .from("migration_logs")
          .insert({
            name: migration_name,
            sql_content: sql,
            executed_at: new Date().toISOString(),
            success: false,
            error: errorMessage,
            executed_by: userId,
          });
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          migration_name: migration_name || null,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      await client.end();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
